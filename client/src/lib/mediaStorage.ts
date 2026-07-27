import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { auth, storage } from './firebase'
import { allowedImageTypes, allowedVideoTypes, imageUploadLimit, videoUploadLimit } from './moderation'

const extensionFor = (type: string) => type.split('/')[1]?.split(';')[0] || 'bin'
const dailyLimit = 10 * 1024 * 1024 * 1024
const quotaKey = (uid: string) => `socialstart-upload-usage-${uid}-${new Date().toISOString().slice(0, 10)}`

const validateBlob = (blob: Blob) => {
  const isImage = allowedImageTypes.includes(blob.type)
  const isVideo = allowedVideoTypes.includes(blob.type)
  if (!isImage && !isVideo) throw new Error('That media type is not allowed.')
  if (isImage && blob.size > imageUploadLimit) throw new Error('Images must be 10 MB or smaller.')
  if (isVideo && blob.size > videoUploadLimit) throw new Error('Videos must be 100 MB or smaller.')
}

export async function uploadMedia(source: string, folder: string) {
  if (!source || source.startsWith('http')) return source
  const user = auth.currentUser
  if (!user) return source

  try {
    const response = await fetch(source)
    const blob = await response.blob()
    validateBlob(blob)
    const usageKey = quotaKey(user.uid)
    const usedToday = Number(localStorage.getItem(usageKey) || 0)
    if (usedToday + blob.size > dailyLimit) throw new Error('This account has reached its 10 GB daily upload limit.')
    const extension = extensionFor(blob.type)
    const path = `users/${user.uid}/${folder}/${crypto.randomUUID()}.${extension}`
    const snapshot = await uploadBytes(ref(storage, path), blob, {
      contentType: blob.type || 'application/octet-stream',
      cacheControl: 'public,max-age=31536000,immutable',
    })
    localStorage.setItem(usageKey, String(usedToday + blob.size))
    return await getDownloadURL(snapshot.ref)
  } catch (error) {
    console.error('SocialStart media upload failed', error)
    throw new Error('The media could not be uploaded. Check that Firebase Storage is enabled and try again.')
  }
}
