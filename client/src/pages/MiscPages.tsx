import { useEffect, useRef, useState } from 'react'
import { Bell, Camera, Maximize, MessageCircle, MonitorUp, Radio, Square, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { CategoryPicker } from '../components/CategoryPicker'
import { HashtagPicker } from '../components/HashtagPicker'

const notificationNames:Record<string,string>={welcome:'SocialStart Welcome Bot','1':'Sofia Bell','2':'Mason Reed','3':'Amara Jones'}
const captureScreen=async()=>{
 const devices=navigator.mediaDevices
 if(devices?.getDisplayMedia){
  try{return await devices.getDisplayMedia({video:true,audio:true})}
  catch(error){if(error instanceof DOMException&&['NotAllowedError','AbortError'].includes(error.name))throw error;return devices.getDisplayMedia({video:true,audio:false})}
 }
 const legacy=navigator as Navigator&{getDisplayMedia?:(constraints:MediaStreamConstraints)=>Promise<MediaStream>}
 if(legacy.getDisplayMedia)return legacy.getDisplayMedia({video:true,audio:true})
 throw new Error('SCREEN_SHARE_UNSUPPORTED')
}

export function NotificationsPage(){
 const {unreadByConversation}=useApp(),items=Object.entries(unreadByConversation).filter(([,count])=>count>0)
 return <div className="form-page"><p className="eyebrow">STAY IN THE LOOP</p><h1>Notifications</h1>{items.length?<div className="notification-list">{items.map(([id,count])=><Link className="notification-row" to={`/inbox/${id}`} key={id}><i><MessageCircle/></i><div><b>{count} unread {count===1?'message':'messages'}</b><span>From {notificationNames[id]||'a SocialStart member'} · Tap to read</span></div><strong>{count}</strong></Link>)}</div>:<div className="profile-empty"><Bell/><h3>No notifications yet</h3><p>Your likes, follows, messages, and orders will appear here.</p></div>}</div>
}

export function LivePage(){
 const {addUserPost}=useApp()
 const video=useRef<HTMLVideoElement>(null),cameraVideo=useRef<HTMLVideoElement>(null),mainStream=useRef<MediaStream|null>(null),pipStream=useRef<MediaStream|null>(null),recorder=useRef<MediaRecorder|null>(null),chunks=useRef<Blob[]>([]),drawFrame=useRef(0)
 const [live,setLive]=useState(false),[expanded,setExpanded]=useState(false),[starting,setStarting]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[title,setTitle]=useState(''),[submittedTitle,setSubmittedTitle]=useState(''),[category,setCategory]=useState(''),[hashtags,setHashtags]=useState<string[]>([]),[views,setViews]=useState(0),[cameraOn,setCameraOn]=useState(true),[screenOn,setScreenOn]=useState(false)
 const stopTracks=()=>{mainStream.current?.getTracks().forEach(track=>track.stop());pipStream.current?.getTracks().forEach(track=>track.stop());mainStream.current=null;pipStream.current=null;cancelAnimationFrame(drawFrame.current)}
 const saveReplay=(blob:Blob)=>{const reader=new FileReader();reader.onload=()=>{addUserPost({title:submittedTitle||title||'Livestream replay',image:String(reader.result),mediaType:'video',category:category||undefined,hashtags});setSaving(false)};reader.onerror=()=>{setError('The livestream ended, but its replay could not be saved.');setSaving(false)};reader.readAsDataURL(blob)}
 const endLive=()=>{setSaving(true);if(recorder.current?.state==='recording')recorder.current.stop();else setSaving(false);stopTracks();if(video.current)video.current.srcObject=null;if(cameraVideo.current)cameraVideo.current.srcObject=null;setLive(false);setExpanded(false);setViews(0)}
 useEffect(()=>()=>stopTracks(),[])
 useEffect(()=>{if(!live)return;const timer=window.setInterval(()=>setViews(current=>current+Math.ceil(Math.random()*3)),2500);return()=>window.clearInterval(timer)},[live])
 const startLive=async()=>{try{
  setStarting(true);setError('')
  if(!cameraOn&&!screenOn){setError('Select Camera, Screen share, or both.');return}
  const screen=screenOn?await captureScreen():null
  const camera=cameraOn?await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:true}):null
  const main=screen||camera
  if(!main)throw new Error('No media selected')
  mainStream.current=main;pipStream.current=screen&&camera?camera:null
  if(video.current){video.current.srcObject=main;await video.current.play()}
  if(cameraVideo.current&&pipStream.current){cameraVideo.current.srcObject=pipStream.current;await cameraVideo.current.play()}
  let recorded=main
  if(screen&&camera){
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d')!,screenEl=document.createElement('video'),cameraEl=document.createElement('video')
   screenEl.srcObject=screen;cameraEl.srcObject=camera;screenEl.muted=true;cameraEl.muted=true
   await Promise.all([screenEl.play(),cameraEl.play()]);canvas.width=1280;canvas.height=720
   const draw=()=>{ctx.drawImage(screenEl,0,0,canvas.width,canvas.height);const width=canvas.width*.25,height=width*9/16,x=canvas.width-width-24,y=24;ctx.fillStyle='#111';ctx.fillRect(x-3,y-3,width+6,height+6);ctx.drawImage(cameraEl,x,y,width,height);drawFrame.current=requestAnimationFrame(draw)}
   draw();recorded=canvas.captureStream(30);camera.getAudioTracks().forEach(track=>recorded.addTrack(track))
  }
  chunks.current=[]
  const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm',next=new MediaRecorder(recorded,{mimeType:mime})
  recorder.current=next;next.ondataavailable=event=>{if(event.data.size)chunks.current.push(event.data)};next.onstop=()=>saveReplay(new Blob(chunks.current,{type:mime}));next.start(1000)
  main.getVideoTracks()[0]?.addEventListener('ended',endLive,{once:true});setViews(1);setLive(true)
 }catch(caught){const unsupported=caught instanceof Error&&caught.message==='SCREEN_SHARE_UNSUPPORTED';setError(screenOn?(unsupported?'This browser does not support web screen sharing. Use current Chrome, Edge, or desktop Safari.':'Select a screen, window, or tab in the browser prompt, then click Share.'):'Allow camera and microphone access to start your stream.')}finally{setStarting(false)}}
 return <div className="form-page centered"><p className="eyebrow">GO LIVE</p><h1>Share the moment,<br/>as it happens.</h1>
  <div className={`${live?'live-preview is-live':'live-preview'}${expanded?' live-expanded':''}`}><video ref={video} muted playsInline/>{pipStream.current&&<video className="live-camera-pip" ref={cameraVideo} muted playsInline/>}{!live&&<><Radio/><span>{screenOn&&cameraOn?'Screen share with camera picture-in-picture':screenOn?'Your shared screen will appear here':'Your camera will appear here'}</span></>}{live&&<><i>LIVE</i><b className="live-view-count">{views} views</b><button className="live-fullscreen" onClick={()=>setExpanded(!expanded)} aria-label={expanded?'Exit livestream fullscreen':'View livestream fullscreen'}>{expanded?<X/>:<Maximize/>}</button></>}</div>
  <form className="live-title-form" onSubmit={event=>{event.preventDefault();if(title.trim())setSubmittedTitle(title.trim())}}><label className="field">Stream title<input value={title} onChange={event=>{setTitle(event.target.value);setSubmittedTitle('')}} placeholder="What are you sharing?"/></label><button className="secondary-btn" disabled={!title.trim()} type="submit">Submit title</button></form>
  <CategoryPicker value={category} onChange={setCategory}/><HashtagPicker value={hashtags} onChange={setHashtags}/>
  {submittedTitle&&<p className="save-success">Title ready: {submittedTitle}</p>}{error&&<p className="camera-error">{error}</p>}
  {!live&&<><div className="live-source-picker"><button type="button" className={cameraOn?'active':''} onClick={()=>setCameraOn(!cameraOn)}><Camera/> Camera</button><button type="button" className={screenOn?'active':''} onClick={()=>setScreenOn(!screenOn)}><MonitorUp/> Screen share</button></div>{screenOn&&<p className="screen-share-help"><b>Sharing tip:</b> select a screen, window, or tab preview in the browser prompt, then click Share. Leave Camera selected for picture-in-picture.</p>}</>}
  <div className="live-actions">{live?<button onClick={endLive} className="secondary-btn end-live"><Square/> End stream & save replay</button>:<button onClick={startLive} disabled={starting||saving||!submittedTitle||(!cameraOn&&!screenOn)} className="primary-btn"><Radio/> {starting?'Starting…':saving?'Saving replay…':'Start live stream'}</button>}</div>
 </div>
}
