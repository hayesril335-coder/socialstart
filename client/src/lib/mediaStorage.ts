import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { auth, storage } from './firebase'

const extensionFor = (type: string) => type.split('/')[1]?.split(';')[0] || 'bin'

export async function uploadMedia(source: string, folder: string) {
  if (!source || source.startsWith('http')) return source
  const user = auth.currentUser
  if (!user) return source

  try {
    const response = await fetch(source)
    const blob = await response.blob()
    const extension = extensionFor(blob.type)
    const path = `users/${user.uid}/${folder}/${crypto.randomUUID()}.${extension}`
    const snapshot = await uploadBytes(ref(storage, path), blob, {
      contentType: blob.type || 'application/octet-stream',
      cacheControl: 'public,max-age=31536000,immutable',
    })
    return await getDownloadURL(snapshot.ref)
  } catch (error) {
    console.error('SocialStart media upload failed', error)
    throw new Error('The media could not be uploaded. Check that Firebase Storage is enabled and try again.')
  }
}
