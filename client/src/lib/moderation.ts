const clearlyIllegalPatterns = [
  /\b(child sexual|sexual content involving (a )?minor|csam)\b/i,
  /\b(buy|sell|ship|traffic)\b.{0,24}\b(cocaine|heroin|methamphetamine|fentanyl)\b/i,
  /\b(human trafficking|sell a person|buy a person)\b/i,
  /\b(buy|sell|traffic)\b.{0,24}\b(illegal weapon|stolen gun)\b/i,
]

export const moderateText = (text: string) =>
  clearlyIllegalPatterns.some(pattern => pattern.test(text))
    ? 'This content cannot be shared because it appears to involve illegal activity.'
    : ''

export const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
export const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime']
export const imageUploadLimit = 10 * 1024 * 1024
export const videoUploadLimit = 100 * 1024 * 1024

export const validateMediaFile = (file: File) => {
  const isImage = allowedImageTypes.includes(file.type)
  const isVideo = allowedVideoTypes.includes(file.type)
  if (!isImage && !isVideo) return 'Use a JPEG, PNG, WebP, GIF, HEIC, MP4, WebM, or MOV file.'
  if (isImage && file.size > imageUploadLimit) return 'Images must be 10 MB or smaller.'
  if (isVideo && file.size > videoUploadLimit) return 'Videos must be 100 MB or smaller.'
  return moderateText(file.name)
}

export const readVideoDuration = (source: string) => new Promise<number>((resolve, reject) => {
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.onloadedmetadata = () => {
    const duration = video.duration
    video.removeAttribute('src')
    video.load()
    Number.isFinite(duration) && duration > 0 ? resolve(duration) : reject(new Error('The video duration could not be verified.'))
  }
  video.onerror = () => reject(new Error('The video could not be read. Please use MP4, WebM, or MOV.'))
  video.src = source
})
