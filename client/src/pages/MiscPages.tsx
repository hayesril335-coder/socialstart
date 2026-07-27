import { useEffect, useRef, useState } from 'react'
import { Bell, Maximize, MessageCircle, Radio, Square, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
const notificationNames:Record<string,string>={welcome:'SocialStart Welcome Bot','1':'Sofia Bell','2':'Mason Reed','3':'Amara Jones'}
export function NotificationsPage(){
 const {unreadByConversation}=useApp(),items=Object.entries(unreadByConversation).filter(([,count])=>count>0)
 return <div className="form-page"><p className="eyebrow">STAY IN THE LOOP</p><h1>Notifications</h1>{items.length?<div className="notification-list">{items.map(([id,count])=><Link className="notification-row" to={`/inbox/${id}`} key={id}><i><MessageCircle/></i><div><b>{count} unread {count===1?'message':'messages'}</b><span>From {notificationNames[id]||'a SocialStart member'} · Tap to read</span></div><strong>{count}</strong></Link>)}</div>:<div className="profile-empty"><Bell/><h3>No notifications yet</h3><p>Your likes, follows, messages, and orders will appear here.</p></div>}</div>
}
export function LivePage(){
 const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null)
 const [live,setLive]=useState(false),[expanded,setExpanded]=useState(false),[starting,setStarting]=useState(false),[error,setError]=useState(''),[title,setTitle]=useState(''),[submittedTitle,setSubmittedTitle]=useState(''),[views,setViews]=useState(0)
 useEffect(()=>()=>stream.current?.getTracks().forEach(track=>track.stop()),[])
 useEffect(()=>{if(!live)return;const timer=window.setInterval(()=>setViews(current=>current+Math.ceil(Math.random()*3)),2500);return()=>window.clearInterval(timer)},[live])
 const startLive=async()=>{try{setStarting(true);setError('');if(!navigator.mediaDevices?.getUserMedia)throw new Error();const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:true});stream.current=media;if(video.current){video.current.srcObject=media;await video.current.play()}setViews(1);setLive(true)}catch{setError('Allow camera and microphone access to start your live stream.')}finally{setStarting(false)}}
 const endLive=()=>{stream.current?.getTracks().forEach(track=>track.stop());if(video.current)video.current.srcObject=null;setLive(false);setExpanded(false);setViews(0)}
 return <div className="form-page centered"><p className="eyebrow">GO LIVE</p><h1>Share the moment,<br/>as it happens.</h1><div className={`${live?'live-preview is-live':'live-preview'}${expanded?' live-expanded':''}`}><video ref={video} muted playsInline/>{!live&&<><Radio/><span>Your camera will appear here</span></>}{live&&<><i>LIVE</i><b className="live-view-count">{views} views</b><button className="live-fullscreen" onClick={()=>setExpanded(!expanded)} aria-label={expanded?'Exit livestream fullscreen':'View livestream fullscreen'}>{expanded?<X/>:<Maximize/>}</button></>}</div>
  <form className="live-title-form" onSubmit={event=>{event.preventDefault();if(title.trim())setSubmittedTitle(title.trim())}}><label className="field">Stream title<input value={title} onChange={e=>{setTitle(e.target.value);setSubmittedTitle('')}} placeholder="What are you sharing?"/></label><button className="secondary-btn" disabled={!title.trim()} type="submit">Submit title</button></form>{submittedTitle&&<p className="save-success">Title ready: {submittedTitle}</p>}{error&&<p className="camera-error">{error}</p>}<div className="live-actions">{live?<button onClick={endLive} className="secondary-btn end-live"><Square/> End live stream</button>:<button onClick={startLive} disabled={starting||!submittedTitle} className="primary-btn"><Radio/> {starting?'Starting…':'Start live stream'}</button>}</div>
 </div>
}
