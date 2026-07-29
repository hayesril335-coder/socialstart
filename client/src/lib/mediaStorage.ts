import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, storage } from './firebase'
import { allowedImageTypes, allowedVideoTypes, imageUploadLimit, videoUploadLimit } from './moderation'

const extensionFor = (type: string) => type.split('/')[1]?.split(';')[0] || 'bin'
const dailyLimit = 10 * 1024 * 1024 * 1024
const quotaKey = (uid: string) => `socialstart-upload-usage-${uid}-${new Date().toISOString().slice(0, 10)}`
const chunkPrefix='socialstart-chunked:'
const chunkCacheKey=(id:string)=>`socialstart-media-cache-${id}`

const validateBlob = (blob: Blob) => {
  const isImage = allowedImageTypes.includes(blob.type)
  const isVideo = allowedVideoTypes.includes(blob.type)
  if (!isImage && !isVideo) throw new Error('That media type is not allowed.')
  if (isImage && blob.size > imageUploadLimit) throw new Error('Images must be 10 MB or smaller.')
  if (isVideo && blob.size > videoUploadLimit) throw new Error('Videos must be 100 MB or smaller.')
}

const blobToDataUrl=(blob:Blob)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob)})

const saveChunkedVideo=async(blob:Blob,uid:string)=>{
  if(blob.size>8*1024*1024)throw new Error('Video uploads larger than 8 MB currently require Firebase Storage to be available.')
  const mediaId=`${uid}-${crypto.randomUUID()}`,data=await blobToDataUrl(blob),chunkSize=600_000,total=Math.ceil(data.length/chunkSize)
  await Promise.all(Array.from({length:total},(_,index)=>setDoc(doc(db,'mediaChunks',`${mediaId}-${index}`),{mediaId,ownerId:uid,index,total,data:data.slice(index*chunkSize,(index+1)*chunkSize),contentType:blob.type,createdAt:serverTimestamp()})))
  localStorage.setItem(chunkCacheKey(mediaId),data)
  return `${chunkPrefix}${mediaId}`
}

export const mediaUrl=(source:string)=>{
  if(!source.startsWith(chunkPrefix))return source
  return localStorage.getItem(chunkCacheKey(source.slice(chunkPrefix.length)))||''
}

export async function hydrateChunkedMedia(){
  const results=await getDocs(query(collection(db,'mediaChunks'),limit(500))),groups=new Map<string,{total:number;parts:Map<number,string>}>()
  results.forEach(result=>{const item=result.data() as {mediaId?:string;index?:number;total?:number;data?:string};if(!item.mediaId||item.index===undefined||!item.total||!item.data)return;const group=groups.get(item.mediaId)||{total:item.total,parts:new Map<number,string>()};group.parts.set(item.index,item.data);groups.set(item.mediaId,group)})
  groups.forEach((group,id)=>{if(group.parts.size===group.total)localStorage.setItem(chunkCacheKey(id),Array.from({length:group.total},(_,index)=>group.parts.get(index)||'').join(''))})
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
    const upload = uploadBytes(ref(storage, path), blob, {
      contentType: blob.type || 'application/octet-stream',
      cacheControl: 'public,max-age=31536000,immutable',
    })
    const snapshot = await Promise.race([
      upload,
      new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), 25_000)),
    ])
    localStorage.setItem(usageKey, String(usedToday + blob.size))
    return await getDownloadURL(snapshot.ref)
  } catch (error) {
    console.error('SocialStart media upload failed', error)
    try{
      const response=await fetch(source),blob=await response.blob()
      if(blob.type.startsWith('video/')&&user){
        try{return await saveChunkedVideo(blob,user.uid)}
        catch(fallbackError){
          console.error('SocialStart chunked video fallback failed',fallbackError)
          if(blob.size<=8*1024*1024)return await blobToDataUrl(blob)
        }
      }
    }catch(fallbackError){console.error('SocialStart chunked video fallback failed',fallbackError)}
    // A compressed data URL is still account-persistent and is preferable to an
    // upload control that never finishes when Storage is temporarily unavailable.
    if (source.startsWith('data:') && source.length < 750_000) return source
    throw new Error('The upload did not finish. Check your connection and try again.')
  }
}
