import { collection, deleteDoc, documentId, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './firebase'
import { hydrateChunkedMedia } from './mediaStorage'

const excludedKeys = new Set([
  'socialstart-account',
  'socialstart-accounts',
  'socialstart-authenticated',
  'socialstart-active-account',
  'socialstart-moderator-session',
  'socialstart-hashtag-registry',
  'socialstart-global-follower-alerts',
])
const privateKeyFragments = ['password', 'security', 'billing']
let cloudUser: User | null = null
let ready = false
let saveTimer: number | undefined
let presenceTimer: number | undefined
let socialPointsTimer: number | undefined
const sharedFingerprints = new Map<string, string>()

const isSyncableKey = (key: string) =>
  key.startsWith('socialstart-') &&
  !excludedKeys.has(key) &&
  !key.startsWith('socialstart-account-data-') &&
  !privateKeyFragments.some(fragment => key.includes(fragment))

const collectState = () => {
  const state: Record<string, string> = {}
  let size = 0
  const priority = ['socialstart-settings-profile','socialstart-user-posts','socialstart-post-metrics','socialstart-locked-posts','socialstart-deleted-post-ids','socialstart-membership-plans','socialstart-following']
  const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key):key is string=>Boolean(key))
  const priorityScore=(key:string)=>key.startsWith('socialstart-account-store-')?1:(priority.indexOf(key)<0?priority.length:priority.indexOf(key))
  keys.sort((a,b)=>priorityScore(a)-priorityScore(b))
  for (const key of keys) {
    if (!key || !isSyncableKey(key)) continue
    const value = localStorage.getItem(key)
    if (value === null) continue
    const itemSize = key.length + value.length
    // Firestore documents are limited to 1 MiB. Large camera uploads will move
    // to Firebase Storage separately; never let one block account-state sync.
    if (itemSize > 300_000 || size + itemSize > 700_000) continue
    state[key] = value
    size += itemSize
  }
  return state
}

const valueScore = (value: string) => {
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed === 'number') return Math.max(1, parsed)
    if (Array.isArray(parsed)) return parsed.length * 10_000 + value.length
    if (parsed && typeof parsed === 'object') return Object.keys(parsed).length * 10_000 + value.length
  } catch { /* Plain strings are scored by their useful content. */ }
  return value.length
}

const mergeState = (cloud: Record<string, string>, local: Record<string, string>) => {
  const merged = { ...cloud }
  Object.entries(local).forEach(([key, value]) => {
    if (!(key in merged) || valueScore(value) > valueScore(merged[key])) merged[key] = value
  })
  return merged
}

const restoreLegacySnapshot = (user: User) => {
  const email = user.email?.trim().toLowerCase()
  if (!email) return null
  let best: { accountId: string; state: Record<string, string>; score: number } | null = null
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index)
    if (!key?.startsWith('socialstart-account-data-')) continue
    try {
      const state = JSON.parse(localStorage.getItem(key) || '{}') as Record<string, string>
      const profile = JSON.parse(state['socialstart-settings-profile'] || '{}') as { email?: string }
      if (profile.email?.trim().toLowerCase() !== email) continue
      const score = Object.values(state).reduce((total, value) => total + valueScore(value), 0)
      if (!best || score > best.score) best = {
        accountId: key.slice('socialstart-account-data-'.length),
        state,
        score,
      }
    } catch { /* Ignore damaged legacy snapshots. */ }
  }
  if (!best) return null
  const merged = mergeState(collectState(), best.state)
  Object.entries(merged).forEach(([key, value]) => {
    if (isSyncableKey(key)) localStorage.setItem(key, value)
  })
  return best.accountId
}

const applyState = (state: Record<string, string>) => {
  const currentKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
  currentKeys.forEach(key => {
    if (key && isSyncableKey(key)) localStorage.removeItem(key)
  })
  Object.entries(state).forEach(([key, value]) => {
    if (isSyncableKey(key)) localStorage.setItem(key, value)
  })
}

const readJson = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback }
}

const writeWhenChanged = async (path: string, payload: Record<string, unknown>) => {
  const fingerprint = JSON.stringify(payload)
  if (sharedFingerprints.get(path) === fingerprint) return
  await setDoc(doc(db, path), { ...payload, updatedAt: serverTimestamp() }, { merge: true })
  sharedFingerprints.set(path, fingerprint)
}

const syncSharedData = async (user: User) => {
  const profile = readJson<Record<string, string>>('socialstart-settings-profile', {})
  const ownPosts = readJson<Array<Record<string, unknown>>>('socialstart-user-posts', [])
  const metrics = readJson<Record<string, { likes?: number; views?: number }>>('socialstart-post-metrics', {})
  const following = readJson<string[]>('socialstart-following', [])
  const followGraph = readJson<Record<string, string[]>>('socialstart-global-follow-graph', {})
  const username = profile.username || ''
  const stats = {
    followers: Object.values(followGraph).filter(list => list.includes(username)).length,
    following: following.length,
    likes: ownPosts.reduce((total, post) => total + Number(post.likes || 0) + Number(metrics[String(post.id)]?.likes || 0), 0),
    views: ownPosts.reduce((total, post) => total + Number(post.views || 0) + Number(metrics[String(post.id)]?.views || 0), 0),
    socialPoints: readJson<number>('socialstart-points', 0),
    pointsUsed: readJson<number>('socialstart-points-used', 0),
  }
  await writeWhenChanged(`publicProfiles/${user.uid}`, {
    ...profile,
    uid: user.uid,
    email: user.email || '',
    stats,
  })

  const storeKey = `socialstart-account-store-${user.uid}`
  const store = readJson<Record<string, unknown>>(storeKey, {})
  if (Object.keys(store).length) {
    await writeWhenChanged(`stores/${user.uid}`, { ...store, ownerId: user.uid })
  }

  const deletedPostIds = readJson<string[]>('socialstart-deleted-post-ids', [])
  await Promise.all(deletedPostIds.map(id => deleteDoc(doc(db, 'posts', id)).catch(()=>undefined)))

  await Promise.all(ownPosts.map(async post => {
    const payload = { ...post, ownerAccountId: user.uid, ownerId: user.uid }
    // Firestore has a 1 MiB per-document limit. Normal photos fit; very large
    // camera videos remain local until Firebase Storage is enabled.
    if (JSON.stringify(payload).length < 850_000 && typeof post.id === 'string') {
      await writeWhenChanged(`posts/${post.id}`, payload)
    }
  }))

  const commentWrites: Promise<void>[] = []
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index)
    if (!key?.startsWith('socialstart-comments-')) continue
    const postId = key.slice('socialstart-comments-'.length)
    const comments = readJson<unknown[]>(key, [])
    commentWrites.push(writeWhenChanged(`comments/${postId}`, { comments }))
  }
  await Promise.all(commentWrites)
}

const loadSharedData = async (user?:User) => {
  const [postResults, storeResults, profileResults] = await Promise.all([
    getDocs(query(collection(db, 'posts'), limit(60))),
    getDocs(query(collection(db, 'stores'), limit(100))),
    getDocs(query(collection(db, 'publicProfiles'), limit(100))),
  ])
  const localPosts = readJson<Array<Record<string, unknown>>>('socialstart-public-posts', [])
  const postsById = new Map(localPosts.map(post => [String(post.id), post]))
  postResults.forEach(result => postsById.set(result.id, { ...result.data(), id: result.id }))
  readJson<string[]>('socialstart-deleted-post-ids', []).forEach(id=>postsById.delete(id))
  localStorage.setItem('socialstart-public-posts', JSON.stringify([...postsById.values()]))
  if(user){
    const profile=readJson<{username?:string}>('socialstart-settings-profile',{}),ownPosts=readJson<Array<Record<string,unknown>>>('socialstart-user-posts',[]),ownById=new Map(ownPosts.map(post=>[String(post.id),post]))
    postsById.forEach(post=>{if(post.ownerAccountId===user.uid||post.ownerId===user.uid||Boolean(profile.username&&post.username===profile.username))ownById.set(String(post.id),post)})
    localStorage.setItem('socialstart-user-posts',JSON.stringify([...ownById.values()]))
  }
  storeResults.forEach(result => localStorage.setItem(`socialstart-account-store-${result.id}`, JSON.stringify(result.data())))
  profileResults.forEach(result => localStorage.setItem(`socialstart-public-profile-${result.id}`, JSON.stringify(result.data())))
  const postIds = postResults.docs.map(result => result.id)
  for (let offset = 0; offset < postIds.length; offset += 30) {
    const ids = postIds.slice(offset, offset + 30)
    if (!ids.length) continue
    const results = await getDocs(query(collection(db, 'comments'), where(documentId(), 'in', ids)))
    results.forEach(result => localStorage.setItem(`socialstart-comments-${result.id}`, JSON.stringify(result.data().comments || [])))
  }
  await hydrateChunkedMedia().catch(error=>console.error('SocialStart media hydration failed',error))
}

const loadPointAwards=async(user:User)=>{
  const profile=readJson<{username?:string}>('socialstart-settings-profile',{})
  if(!profile.username)return
  try{
    const results=await getDocs(query(collection(db,'pointAwards'),where('targetUsername','==',profile.username),limit(500)))
    const applied=readJson<string[]>('socialstart-applied-point-awards',[]),appliedSet=new Set(applied),fresh=results.docs.filter(result=>!appliedSet.has(result.id))
    if(!fresh.length)return
    localStorage.setItem('socialstart-points',JSON.stringify(readJson<number>('socialstart-points',0)+fresh.length))
    localStorage.setItem('socialstart-applied-point-awards',JSON.stringify([...applied,...fresh.map(result=>result.id)].slice(-2000)))
    localStorage.setItem('socialstart-state-updated-at',JSON.stringify(Date.now()))
  }catch(error){console.error('SocialStart point awards could not be loaded',error)}
}

export function awardSocialPoint(targetUsername:string,reason:'view_received'|'like_received'|'follow_received',eventId:string){
  if(!ready||!cloudUser||!targetUsername)return
  const ownUsername=readJson<{username?:string}>('socialstart-settings-profile',{}).username
  if(ownUsername===targetUsername)return
  const safeId=`${cloudUser.uid}_${reason}_${targetUsername}_${eventId}`.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,500)
  void setDoc(doc(db,'pointAwards',safeId),{targetUsername,reason,eventId,actorId:cloudUser.uid,amount:1,createdAt:serverTimestamp()},{merge:false}).catch(error=>console.error('SocialStart point award could not be saved',error))
}

const updatePresence = async () => {
  if (!cloudUser) return
  await setDoc(doc(db, 'publicProfiles', cloudUser.uid), {
    uid: cloudUser.uid,
    lastActiveAt: Date.now(),
    presenceUpdatedAt: serverTimestamp(),
  }, { merge: true })
}

export async function prepareCloudAccount(user: User, profile?: Record<string, string>) {
  cloudUser = user
  const moderatorCreditRepairKey = 'socialstart-moderator-credit-repair-v4'
  const previousAccountId = localStorage.getItem('socialstart-active-account')
  const currentProfile = readJson<{ email?: string }>('socialstart-settings-profile', {})
  const localStateBelongsToUser = previousAccountId === user.uid || Boolean(user.email && currentProfile.email?.trim().toLowerCase() === user.email.trim().toLowerCase())
  if (!localStateBelongsToUser) {
    if (previousAccountId) localStorage.setItem(`socialstart-account-data-${previousAccountId}`, JSON.stringify(collectState()))
    applyState({})
  }
  const legacyAccountId = restoreLegacySnapshot(user)
  if (user.email !== 'moderator@socialstart.app' && localStorage.getItem(moderatorCreditRepairKey) !== 'true') {
    const localBalance = readJson<number>('socialstart-balance', 0)
    const localPoints = readJson<number>('socialstart-points', 0)
    if (localBalance >= 1000 || localPoints >= 1000) {
      localStorage.setItem('socialstart-balance', JSON.stringify(Math.max(0, localBalance - 1000)))
      localStorage.setItem('socialstart-points', JSON.stringify(Math.max(0, localPoints - 1000)))
    }
    localStorage.setItem(moderatorCreditRepairKey, 'true')
  }
  const legacyState = localStateBelongsToUser || legacyAccountId ? collectState() : {}
  const reference = doc(db, 'users', user.uid)
  let snapshot
  try {
    snapshot = await getDoc(reference)
  } catch (error) {
    applyState(legacyState)
    if (profile) {
      const existing = readJson<Record<string,string>>('socialstart-settings-profile', {})
      localStorage.setItem('socialstart-settings-profile', JSON.stringify({ ...existing, ...profile }))
    }
    localStorage.setItem('socialstart-active-account', user.uid)
    localStorage.setItem('socialstart-authenticated', 'true')
    ready = false
    throw error
  }
  if (snapshot.exists()) {
    const cloudState = snapshot.data().state
    const savedCloudState = cloudState && typeof cloudState === 'object' ? { ...cloudState as Record<string, string> } : {}
    const dedicatedSocialPoints = Number(snapshot.data().socialPoints)
    if (Number.isFinite(dedicatedSocialPoints)) {
      const stateSocialPoints = Number(JSON.parse(savedCloudState['socialstart-points'] || '0'))
      savedCloudState['socialstart-points'] = JSON.stringify(Math.max(0, stateSocialPoints, dedicatedSocialPoints))
    }
    const localUpdatedAt = Number(readJson<number>('socialstart-state-updated-at', 0))
    const cloudUpdatedAt = Number(JSON.parse(savedCloudState['socialstart-state-updated-at'] || '0'))
    const state = localStateBelongsToUser && localUpdatedAt > cloudUpdatedAt ? { ...savedCloudState, ...legacyState } : savedCloudState
    let repaired = false
    if (cloudState && typeof cloudState === 'object') {
      try {
        const savedProfile = JSON.parse(state['socialstart-settings-profile'] || '{}') as { username?: string }
        const moderatorLeak = savedProfile.username === 'socialstartmod' || state['socialstart-moderator-session'] === 'true'
        if (moderatorLeak && user.email !== 'moderator@socialstart.app') {
          const emailName = user.email?.split('@')[0] || user.uid.slice(0, 12)
          if(savedProfile.username === 'socialstartmod')state['socialstart-settings-profile'] = JSON.stringify({name:user.displayName||emailName,username:emailName.replace(/[^a-zA-Z0-9._]/g,''),email:user.email||'',bio:'Creating and sharing on SocialStart.',location:'',...(user.photoURL?{avatar:user.photoURL}:{})})
          const balance = Number(JSON.parse(state['socialstart-balance'] || '0'))
          const points = Number(JSON.parse(state['socialstart-points'] || '0'))
          state['socialstart-balance'] = JSON.stringify(Math.max(0, balance - 1000))
          state['socialstart-points'] = JSON.stringify(Math.max(0, points - 1000))
          delete state['socialstart-moderator-session']
          repaired = true
        }
        if (user.email !== 'moderator@socialstart.app' && state[moderatorCreditRepairKey] !== 'true') {
          const balance = Number(JSON.parse(state['socialstart-balance'] || '0'))
          const points = Number(JSON.parse(state['socialstart-points'] || '0'))
          if (balance >= 1000 || points >= 1000) {
            state['socialstart-balance'] = JSON.stringify(Math.max(0, balance - 1000))
            state['socialstart-points'] = JSON.stringify(Math.max(0, points - 1000))
          }
          state[moderatorCreditRepairKey] = 'true'
          repaired = true
        }
      } catch { /* Leave a valid non-moderator account state unchanged. */ }
    }
    applyState(state)
    if(repaired)await setDoc(reference, { state, email: user.email || '', updatedAt: serverTimestamp() }, { merge: true })
  } else {
    applyState(legacyState)
    if (profile) {
      const existing = readJson<Record<string,string>>('socialstart-settings-profile', {})
      localStorage.setItem('socialstart-settings-profile', JSON.stringify({ ...existing, ...profile }))
    }
    await setDoc(reference, { state: collectState(), email: user.email || '', updatedAt: serverTimestamp() })
  }
  localStorage.setItem('socialstart-active-account', user.uid)
  localStorage.setItem('socialstart-authenticated', 'true')
  await syncSharedData(user)
  await loadSharedData(user)
  await loadPointAwards(user)
  ready = true
  window.clearInterval(presenceTimer)
  await updatePresence()
  presenceTimer = window.setInterval(() => void updatePresence(), 300_000)
}

export function scheduleCloudSave() {
  if (!ready || !cloudUser) return
  localStorage.setItem('socialstart-state-updated-at', JSON.stringify(Date.now()))
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    if (!cloudUser) return
    void Promise.all([setDoc(doc(db, 'users', cloudUser.uid), {
      state: collectState(),
      socialPoints: readJson<number>('socialstart-points', 0),
      email: cloudUser.email || '',
      updatedAt: serverTimestamp(),
    }, { merge: true }), syncSharedData(cloudUser)])
      .catch(error => console.error('SocialStart cloud sync failed', error))
  }, 500)
}

export async function flushCloudSave() {
  window.clearTimeout(saveTimer)
  if (!cloudUser) return
  await Promise.all([
    setDoc(doc(db, 'users', cloudUser.uid), {
      state: collectState(),
      socialPoints: readJson<number>('socialstart-points', 0),
      email: cloudUser.email || '',
      updatedAt: serverTimestamp(),
    }, { merge: true }),
    syncSharedData(cloudUser),
  ])
}

export function persistSocialPointBalance(points: number) {
  if (!ready || !cloudUser) return
  window.clearTimeout(socialPointsTimer)
  socialPointsTimer = window.setTimeout(() => {
    if (!cloudUser) return
    void setDoc(doc(db, 'users', cloudUser.uid), {
      state: collectState(),
      socialPoints: Math.max(0, points),
      email: cloudUser.email || '',
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch(error => console.error('SocialStart points could not be saved', error))
  }, 200)
}

export async function saveStoreNow(store: Record<string, unknown>) {
  if (!cloudUser) return
  await setDoc(doc(db, 'stores', cloudUser.uid), {
    ...store,
    ownerId: cloudUser.uid,
    updatedAt: serverTimestamp(),
  }, { merge: true })
  await flushCloudSave()
}

export function stopCloudSync() {
  ready = false
  cloudUser = null
  window.clearTimeout(saveTimer)
  window.clearTimeout(socialPointsTimer)
  window.clearInterval(presenceTimer)
  sharedFingerprints.clear()
}
