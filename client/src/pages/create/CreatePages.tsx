import { useEffect, useRef, useState } from 'react'
import { Camera, Image, Radio, Repeat2, Square, Upload, Video, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const choices=[['/create/photo','Take picture',Camera,'Open your camera and capture the moment'],['/create/video','Take video',Video,'Open your camera and begin recording'],['/create/story','Add story',Repeat2,'Share a moment for 24 hours'],['/create/post','Create post',Image,'Upload a photo or video'],['/create/one-for-one','One For One',Upload,'Promote and earn Social Points'],['/create/live','Go live',Radio,'Broadcast to your community']] as const

export function CreateHubPage(){return <div className="create-page"><p className="eyebrow">START SOMETHING</p><h1>What will you<br/><em>share today?</em></h1><div className="create-grid">{choices.map(([to,title,Icon,desc],i)=><Link to={to} key={to} className={i===4?'accent':''}><Icon/><b>{title}</b><span>{desc}</span><i>0{i+1}</i></Link>)}</div></div>}

export function MediaCreatePage(){
 const location=useLocation(),navigate=useNavigate(),{addUserPost}=useApp(),input=useRef<HTMLInputElement>(null),video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),recorder=useRef<MediaRecorder|null>(null),chunks=useRef<Blob[]>([])
 const [preview,setPreview]=useState(''),[title,setTitle]=useState(''),[cameraReady,setCameraReady]=useState(false),[recording,setRecording]=useState(false),[error,setError]=useState('')
 const kind=location.pathname.includes('one-for-one/upload')?'Promo':location.pathname.includes('story')?'Story':location.pathname.includes('video')?'Video':location.pathname.includes('photo')?'Photo':'Post'
 const isCamera=kind==='Photo'||kind==='Video'

 useEffect(()=>{
  if(!isCamera)return
  let active=true
  navigator.mediaDevices?.getUserMedia({video:{facingMode:'environment'},audio:kind==='Video'}).then(media=>{
   if(!active){media.getTracks().forEach(track=>track.stop());return}
   stream.current=media
   if(video.current){video.current.srcObject=media;video.current.play()}
   setCameraReady(true)
   if(kind==='Video'&&typeof MediaRecorder!=='undefined'){
    const nextRecorder=new MediaRecorder(media);recorder.current=nextRecorder;chunks.current=[]
    nextRecorder.ondataavailable=event=>{if(event.data.size)chunks.current.push(event.data)}
    nextRecorder.onstop=()=>setPreview(URL.createObjectURL(new Blob(chunks.current,{type:nextRecorder.mimeType||'video/webm'})))
    nextRecorder.start();setRecording(true)
   }
  }).catch(()=>setError('Camera access is needed. You can choose a file instead.'))
  return()=>{active=false;recorder.current?.state==='recording'&&recorder.current.stop();stream.current?.getTracks().forEach(track=>track.stop())}
 },[kind,isCamera])

 const capturePhoto=()=>{
  if(!video.current)return
  const canvas=document.createElement('canvas');canvas.width=video.current.videoWidth;canvas.height=video.current.videoHeight
  canvas.getContext('2d')?.drawImage(video.current,0,0);setPreview(canvas.toDataURL('image/jpeg',.92));stream.current?.getTracks().forEach(track=>track.stop())
 }
 const stopRecording=()=>{if(recorder.current?.state==='recording'){recorder.current.stop();setRecording(false);stream.current?.getTracks().forEach(track=>track.stop())}}
 const chooseFile=(file?:File)=>{if(!file)return;if(kind==='Promo'){const check=document.createElement('video');check.preload='metadata';check.onloadedmetadata=()=>{URL.revokeObjectURL(check.src);if(check.duration>30){setError('One For One videos must be 30 seconds or shorter.');return}setError('');setPreview(URL.createObjectURL(file))};check.src=URL.createObjectURL(file);return}setPreview(URL.createObjectURL(file))}
 const upload=()=>{addUserPost({title,image:preview,mediaType:kind==='Video'||kind==='Promo'?'video':'image'});navigate('/profile')}

 return <div className="form-page"><p className="eyebrow">CREATE / {kind.toUpperCase()}</p><h1>{kind==='Photo'?'Take a picture':kind==='Video'?'Record a video':`Share a new ${kind.toLowerCase()}`}</h1>
  {isCamera&&!preview?<div className="camera-stage"><video ref={video} muted playsInline/><div className="camera-status">{recording?<><i/> Recording</>:cameraReady?'Camera ready':'Starting camera…'}</div>{kind==='Photo'&&cameraReady&&<button onClick={capturePhoto} className="shutter" aria-label="Take picture"><i/></button>}{kind==='Video'&&recording&&<button onClick={stopRecording} className="stop-recording"><Square/> Stop recording</button>}</div>:<div onClick={()=>input.current?.click()} className="upload-drop">{preview?(kind==='Video'?<video src={preview} controls/>:<img src={preview}/>):<><Upload/><b>Choose {kind==='Video'?'a video':'photo or video'}</b><span>Tap to browse from your device</span></>}</div>}
  {error&&<p className="camera-error">{error}</p>}<input ref={input} hidden type="file" capture={kind==='Photo'?'environment':undefined} accept={kind==='Video'||kind==='Promo'?'video/*':'image/*,video/*'} onChange={e=>chooseFile(e.target.files?.[0])}/>
  {isCamera&&!preview&&<button className="camera-fallback" onClick={()=>input.current?.click()}>Choose from device instead</button>}
  {preview&&<><label className="field">Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Give your post a title…"/></label>{kind==='Story'&&<p className="form-note">Your story will disappear after 24 hours.</p>}<div className="form-actions"><button className="secondary-btn" onClick={()=>{setPreview('');if(isCamera)navigate(0)}}><X/> Retake</button><button className="primary-btn" disabled={!title} onClick={upload}>Upload {kind}</button></div></>}
  {!preview&&!isCamera&&<><label className="field">Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Give your post a title…"/></label><div className="form-actions"><button className="secondary-btn" onClick={()=>navigate('/create')}><X/> Cancel</button></div></>}
 </div>
}

export function OneForOnePage(){return <div className="create-page"><p className="eyebrow">ONE FOR ONE</p><h1>Share attention.<br/><em>Earn attention.</em></h1><p className="lead">Watch a creator’s promo and earn a point. Spend your points to put your own work in front of someone new.</p><div className="create-grid two"><Link to="/create/one-for-one/upload"><Upload/><b>Add a promo</b><span>Upload a video up to 30 seconds</span></Link><Link className="accent" to="/create/one-for-one/earn"><Video/><b>Earn Social Points</b><span>Watch promos from other creators</span></Link></div></div>}
export function EarnPointsPage(){
 const {points,earnPoint}=useApp(),timer=useRef<ReturnType<typeof setInterval>|null>(null)
 const [progress,setProgress]=useState(0),[playing,setPlaying]=useState(false),[earned,setEarned]=useState(false),[videoNumber,setVideoNumber]=useState(1)
 useEffect(()=>()=>{if(timer.current)clearInterval(timer.current)},[])
 const play=()=>{if(playing)return;setPlaying(true);setEarned(false);timer.current=setInterval(()=>setProgress(current=>{const next=current+10;if(next>=100){if(timer.current)clearInterval(timer.current);setPlaying(false);setEarned(true);earnPoint();return 100}return next}),300)}
 const next=()=>{setVideoNumber(current=>current+1);setProgress(0);setEarned(false)}
 return <div className="form-page centered"><p className="eyebrow">EARN SOCIAL POINTS · {points} EARNED</p><h1>Discover something new</h1><div className="promo-card"><img src={postsImage}/>{!playing&&!earned&&<button onClick={play}>▶ Watch promo</button>}{earned&&<strong className="point-earned">✓ Point earned</strong>}<div><b>Sunday Studio · Video {videoNumber}</b><span>Meet the makers behind every piece.</span></div></div><div className="progress"><i style={{width:`${progress}%`}}/></div><p>{progress}% complete · {earned?'Point added to your profile':'Keep this window active'}</p>{earned&&<button className="primary-btn" onClick={next}>Play Next</button>}</div>
}
const postsImage='https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1000&auto=format&fit=crop'
