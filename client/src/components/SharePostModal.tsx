import { useEffect, useState } from 'react'
import { Link2, Send, X } from 'lucide-react'
import type { Post } from '../types'
import { profiles } from '../utils/mockData'
import { scheduleCloudSave } from '../lib/cloudSync'

export function SharePostModal({ post, onClose, onShared }: { post: Post; onClose: () => void; onShared: () => void }) {
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(30)

  useEffect(() => {
    if (post.mediaType !== 'video') return
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => setEnd(Number.isFinite(video.duration) ? Math.round(video.duration * 10) / 10 : 30)
    video.src = post.image
    return () => { video.removeAttribute('src'); video.load() }
  }, [post.image, post.mediaType])

  const externalShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`
    if (navigator.share) await navigator.share({ title: post.title, text: `See ${post.author}'s post on SocialStart`, url })
    else await navigator.clipboard.writeText(url)
    onShared()
  }

  const sendTo = (username: string) => {
    const key = `socialstart-messages-${username}`
    let messages: unknown[] = []
    try { messages = JSON.parse(localStorage.getItem(key) || '[]') } catch { /* Start a new conversation. */ }
    messages.push({
      text: `Shared ${post.author}'s post`,
      mine: true,
      post: { ...post, trimStart: post.mediaType === 'video' ? start : 0, trimEnd: post.mediaType === 'video' ? end : undefined },
    })
    localStorage.setItem(key, JSON.stringify(messages))
    scheduleCloudSave()
    onShared()
  }

  return <div className="purchase-modal share-post-modal"><div>
    <button className="modal-close" onClick={onClose}><X /></button>
    <Send /><h2>Share this post</h2>
    <button className="secondary-btn wide" onClick={() => void externalShare()}><Link2 /> Share outside SocialStart</button>
    {post.mediaType === 'video' && <div className="trim-controls"><p>Choose the part of the video to send</p><label>Starts at<input type="number" min="0" max={end} step=".1" value={start} onChange={event => setStart(Math.max(0, Number(event.target.value)))} /> seconds</label><label>Ends at<input type="number" min={start + .1} step=".1" value={end} onChange={event => setEnd(Math.max(start + .1, Number(event.target.value)))} /> seconds</label></div>}
    <p className="share-with-label">Send in SocialStart</p>
    <div className="share-recipient-list">{profiles.map(person => <button key={person.username} onClick={() => sendTo(person.username)}><img src={person.avatar} /><span><b>{person.name}</b><small>{person.username}</small></span><Send /></button>)}</div>
  </div></div>
}
