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

export const validateMediaFile = (file: File) => {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return 'Choose an image or video file.'
  if (file.size > 100 * 1024 * 1024) return 'Choose a file smaller than 100 MB.'
  return moderateText(file.name)
}
