import { collection, documentId, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from './firebase'

const excludedKeys = new Set([
  'socialstart-account',
  'socialstart-accounts',
  'socialstart-authenticated',
  'socialstart-active-account',
])
const privateKeyFragments = ['password', 'security', 'billing']
let cloudUser: User | null = null
let ready = false
let saveTimer: number | undefined
let presenceTimer: number | undefined
const sharedFingerprints = new Map<string, string>()

const isSyncableKey = (key: string) =>
  key.startsWith('socialstart-') &&
  !excludedKeys.has(key) &&
  !key.startsWith('socialstart-account-data-') &&
  !privateKeyFragments.some(fragment => key.includes(fragment))

const collectState = () => {
  const state: Record<string, string> = {}
  let size = 0
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index)
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

const loadSharedData = async () => {
  const [postResults, storeResults, profileResults] = await Promise.all([
    getDocs(query(collection(db, 'posts'), limit(60))),
    getDocs(query(collection(db, 'stores'), limit(100))),
    getDocs(query(collection(db, 'publicProfiles'), limit(100))),
  ])
  const localPosts = readJson<Array<Record<string, unknown>>>('socialstart-public-posts', [])
  const postsById = new Map(localPosts.map(post => [String(post.id), post]))
  postResults.forEach(result => postsById.set(result.id, { ...result.data(), id: result.id }))
  localStorage.setItem('socialstart-public-posts', JSON.stringify([...postsById.values()]))
  storeResults.forEach(result => localStorage.setItem(`socialstart-account-store-${result.id}`, JSON.stringify(result.data())))
  profileResults.forEach(result => localStorage.setItem(`socialstart-public-profile-${result.id}`, JSON.stringify(result.data())))
  const postIds = postResults.docs.map(result => result.id)
  for (let offset = 0; offset < postIds.length; offset += 30) {
    const ids = postIds.slice(offset, offset + 30)
    if (!ids.length) continue
    const results = await getDocs(query(collection(db, 'comments'), where(documentId(), 'in', ids)))
    results.forEach(result => localStorage.setItem(`socialstart-comments-${result.id}`, JSON.stringify(result.data().comments || [])))
  }
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
  const previousAccountId = localStorage.getItem('socialstart-active-account') || restoreLegacySnapshot(user)
  if (previousAccountId && previousAccountId !== user.uid) {
    for (const section of ['store', 'promo']) {
      const oldKey = `socialstart-account-${section}-${previousAccountId}`
      const newKey = `socialstart-account-${section}-${user.uid}`
      const oldValue = localStorage.getItem(oldKey)
      if (oldValue && !localStorage.getItem(newKey)) localStorage.setItem(newKey, oldValue)
    }
  }
  const reference = doc(db, 'users', user.uid)
  const snapshot = await getDoc(reference)
  if (snapshot.exists()) {
    const cloudState = snapshot.data().state
    if (cloudState && typeof cloudState === 'object') {
      const state = cloudState as Record<string, string>
      try {
        const savedProfile = JSON.parse(state['socialstart-settings-profile'] || '{}') as { username?: string }
        if (savedProfile.username === 'socialstartmod' && user.email !== 'moderator@socialstart.app') {
          const emailName = user.email?.split('@')[0] || user.uid.slice(0, 12)
          state['socialstart-settings-profile'] = JSON.stringify({
            name: user.displayName || emailName,
            username: emailName.replace(/[^a-zA-Z0-9._]/g, ''),
            email: user.email || '',
            bio: 'Creating and sharing on SocialStart.',
            location: '',
            ...(user.photoURL ? { avatar: user.photoURL } : {}),
          })
          const balance = Number(JSON.parse(state['socialstart-balance'] || '0'))
          const points = Number(JSON.parse(state['socialstart-points'] || '0'))
          state['socialstart-balance'] = JSON.stringify(Math.max(0, balance - 1000))
          state['socialstart-points'] = JSON.stringify(Math.max(0, points - 1000))
        }
      } catch { /* Leave a valid non-moderator account state unchanged. */ }
    }
    const merged = mergeState(
      cloudState && typeof cloudState === 'object' ? cloudState as Record<string, string> : {},
      collectState(),
    )
    applyState(merged)
    await setDoc(reference, { state: merged, email: user.email || '', updatedAt: serverTimestamp() }, { merge: true })
  } else {
    if (profile) {
      let existing: Record<string, string> = {}
      try { existing = JSON.parse(localStorage.getItem('socialstart-settings-profile') || '{}') } catch { /* use supplied profile */ }
      localStorage.setItem('socialstart-settings-profile', JSON.stringify({ ...profile, ...existing }))
    }
    await setDoc(reference, { state: collectState(), email: user.email || '', updatedAt: serverTimestamp() })
  }
  localStorage.setItem('socialstart-active-account', user.uid)
  localStorage.setItem('socialstart-authenticated', 'true')
  await syncSharedData(user)
  await loadSharedData()
  ready = true
  window.clearInterval(presenceTimer)
  await updatePresence()
  presenceTimer = window.setInterval(() => void updatePresence(), 300_000)
}

export function scheduleCloudSave() {
  if (!ready || !cloudUser) return
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    if (!cloudUser) return
    void Promise.all([setDoc(doc(db, 'users', cloudUser.uid), {
      state: collectState(),
      email: cloudUser.email || '',
      updatedAt: serverTimestamp(),
    }, { merge: true }), syncSharedData(cloudUser)])
      .catch(error => console.error('SocialStart cloud sync failed', error))
  }, 500)
}

export function stopCloudSync() {
  ready = false
  cloudUser = null
  window.clearTimeout(saveTimer)
  window.clearInterval(presenceTimer)
  sharedFingerprints.clear()
}
