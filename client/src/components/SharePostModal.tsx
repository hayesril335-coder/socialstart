import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Link2, Scissors, Send, X } from 'lucide-react'
import type { Post } from '../types'
import { profiles } from '../utils/mockData'
import { scheduleCloudSave } from '../lib/cloudSync'

export function SharePostModal({ post, onClose, onShared }: { post: Post; onClose: () => void; onShared: () => void }) {
  const preview = useRef<HTMLVideoElement>(null)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(30)
  const [duration, setDuration] = useState(30)
  const groups=(()=>{try{return JSON.parse(localStorage.getItem('socialstart-group-chats')||'[]') as {id:string;name:string;avatar:string}[]}catch{return []}})()
  const recipients=[...profiles.map(person=>({id:person.username,name:person.name,avatar:person.avatar,username:person.username})),...groups.map(group=>({id:group.id,name:group.name,avatar:group.avatar,username:group.id}))]
  const [recipient, setRecipient] = useState<(typeof recipients)[number] | null>(null)

  useEffect(() => {
    if (post.mediaType !== 'video') return
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const length = Number.isFinite(video.duration) ? Math.round(video.duration * 10) / 10 : 30
      setDuration(length)
      setEnd(length)
    }
    video.src = post.image
    return () => { video.removeAttribute('src'); video.load() }
  }, [post.image, post.mediaType])

  useEffect(() => {
    if (!preview.current) return
    preview.current.currentTime = start
  }, [start, recipient])

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

  if (post.mediaType === 'video' && recipient) return <div className="purchase-modal share-post-modal clip-editor-modal"><div>
    <button className="modal-close" onClick={onClose}><X /></button>
    <button className="clip-back" onClick={() => setRecipient(null)}><ArrowLeft /> Back</button>
    <Scissors /><h2>Choose the video clip</h2>
    <p>Move the start and end controls to send only this part to {recipient.name}.</p>
    <video ref={preview} src={`${post.image}#t=${start},${end}`} controls playsInline />
    <div className="clip-time-readout"><b>{start.toFixed(1)}s</b><span>{(end-start).toFixed(1)} second clip</span><b>{end.toFixed(1)}s</b></div>
    <label className="clip-range">Start time<input aria-label="Clip start time" type="range" min="0" max={Math.max(0,end-.1)} step=".1" value={start} onChange={event=>setStart(Math.min(Number(event.target.value),end-.1))}/></label>
    <label className="clip-range">End time<input aria-label="Clip end time" type="range" min={Math.min(duration,start+.1)} max={duration} step=".1" value={end} onChange={event=>setEnd(Math.max(Number(event.target.value),start+.1))}/></label>
    <button className="primary-btn wide" onClick={()=>sendTo(recipient.username)}><Send/> Send {start.toFixed(1)}s–{end.toFixed(1)}s</button>
  </div></div>

  return <div className="purchase-modal share-post-modal"><div>
    <button className="modal-close" onClick={onClose}><X /></button>
    <Send /><h2>Share this post</h2>
    <button className="secondary-btn wide" onClick={() => void externalShare()}><Link2 /> Share outside SocialStart</button>
    {post.mediaType === 'video' && <p className="clip-notice"><Scissors/> Choose a recipient, then select the exact part of the video to send.</p>}
    <p className="share-with-label">Send in SocialStart</p>
    <div className="share-recipient-list">{recipients.map(person => <button key={person.id} onClick={() => post.mediaType === 'video' ? setRecipient(person) : sendTo(person.username)}>{person.avatar?<img src={person.avatar} />:<span className="share-group-avatar">Group</span>}<span><b>{person.name}</b><small>{groups.some(group=>group.id===person.id)?'Group chat':person.username}</small></span><Send /></button>)}</div>
  </div></div>
}
