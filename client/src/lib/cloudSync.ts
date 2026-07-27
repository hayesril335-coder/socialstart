import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
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
  ready = true
}

export function scheduleCloudSave() {
  if (!ready || !cloudUser) return
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    if (!cloudUser) return
    void setDoc(doc(db, 'users', cloudUser.uid), {
      state: collectState(),
      email: cloudUser.email || '',
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch(error => console.error('SocialStart cloud sync failed', error))
  }, 500)
}

export function stopCloudSync() {
  ready = false
  cloudUser = null
  window.clearTimeout(saveTimer)
}
