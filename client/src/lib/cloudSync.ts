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
  const reference = doc(db, 'users', user.uid)
  const snapshot = await getDoc(reference)
  if (snapshot.exists()) {
    const state = snapshot.data().state
    if (state && typeof state === 'object') applyState(state as Record<string, string>)
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
