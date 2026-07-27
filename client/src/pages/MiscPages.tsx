import { useEffect, useRef, useState } from 'react'
import { Bell, Radio, Square } from 'lucide-react'

export function NotificationsPage(){return <div className="form-page"><p className="eyebrow">STAY IN THE LOOP</p><h1>Notifications</h1><div className="profile-empty"><Bell/><h3>No notifications yet</h3><p>Your likes, follows, messages, and orders will appear here.</p></div></div>}

export function LivePage(){
 const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),[live,setLive]=useState(false),[starting,setStarting]=useState(false),[error,setError]=useState(''),[title,setTitle]=useState('')
 useEffect(()=>()=>stream.current?.getTracks().forEach(track=>track.stop()),[])
 const startLive=async()=>{try{setStarting(true);setError('');const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:true});stream.current=media;if(video.current){video.current.srcObject=media;await video.current.play()}setLive(true)}catch{setError('Allow camera and microphone access to start your live stream.')}finally{setStarting(false)}}
 const endLive=()=>{stream.current?.getTracks().forEach(track=>track.stop());if(video.current)video.current.srcObject=null;setLive(false)}
 return <div className="form-page centered"><p className="eyebrow">GO LIVE</p><h1>Share the moment,<br/>as it happens.</h1><div className={live?'live-preview is-live':'live-preview'}><video ref={video} muted playsInline/>{!live&&<><Radio/><span>Your camera will appear here</span></>}{live&&<i>LIVE</i>}</div><label className="field">Stream title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Optional: what are you sharing?"/></label>{error&&<p className="camera-error">{error}</p>}<div className="live-actions">{live?<button onClick={endLive} className="secondary-btn end-live"><Square/> End live stream</button>:<button onClick={startLive} disabled={starting} className="primary-btn"><Radio/> {starting?'Starting…':'Start live stream'}</button>}</div></div>
}
