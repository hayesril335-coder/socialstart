import { useEffect, useRef, useState } from 'react'
import { Camera, Image, Radio, Repeat2, Square, Trash2, Upload, Video, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { moderateText, readVideoDuration, validateMediaFile } from '../../lib/moderation'
import { uploadMedia } from '../../lib/mediaStorage'
import { scheduleCloudSave } from '../../lib/cloudSync'
import { VideoTestAd } from '../../components/VideoTestAd'
import { CategoryPicker } from '../../components/CategoryPicker'
import { HashtagPicker } from '../../components/HashtagPicker'
import { registerPostHashtags } from '../../lib/hashtags'

const choices=[['/create/photo','Take picture',Camera,'Open your camera and capture the moment'],['/create/video','Take video',Video,'Open your camera and begin recording'],['/create/story','Add story',Repeat2,'Share a moment for 24 hours'],['/create/post','Create post',Image,'Upload a photo or video'],['/create/live','Go live',Radio,'Broadcast to your community']] as const
type Promo={title:string;media:string;mediaType:'image'|'video';views:number;author:string;username:string;avatar:string;category?:string;hashtags?:string[]}
const promoKey=(type?:'image'|'video')=>{const selected=type||(new URLSearchParams(window.location.search).get('type')==='video'?'video':'image');return `socialstart-account-promo-${localStorage.getItem('socialstart-active-account')||'guest'}-${selected}`}
const readPromo=(key=promoKey()):Promo|null=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
const otherPromos=()=>{const own=promoKey(),found:{key:string;promo:Promo}[]=[];for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key?.startsWith('socialstart-account-promo-')&&key!==own){const promo=readPromo(key);if(promo)found.push({key,promo})}}return found}

export function CreateHubPage(){return <div className="create-page"><p className="eyebrow">START SOMETHING</p><h1>What will you<br/><em>share today?</em></h1><div className="create-grid">{choices.map(([to,title,Icon,desc],i)=><Link to={to} key={to} className={i===3?'accent':''}><Icon/><b>{title}</b><span>{desc}</span><i>0{i+1}</i></Link>)}</div></div>}

export function MediaCreatePage(){
 const location=useLocation(),navigate=useNavigate(),{addUserPost}=useApp(),input=useRef<HTMLInputElement>(null),video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),recorder=useRef<MediaRecorder|null>(null),chunks=useRef<Blob[]>([])
 const [preview,setPreview]=useState(''),[title,setTitle]=useState(''),[category,setCategory]=useState(''),[hashtags,setHashtags]=useState<string[]>([]),[cameraReady,setCameraReady]=useState(false),[recording,setRecording]=useState(false),[error,setError]=useState(''),[uploading,setUploading]=useState(false)
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
 const loadPromoFile=(file:File)=>{const reader=new FileReader();reader.onload=()=>{setError('');setPreview(String(reader.result))};reader.readAsDataURL(file)}
 const chooseFile=async(file?:File)=>{if(!file)return;const safetyError=validateMediaFile(file);if(safetyError){setError(safetyError);return}const source=URL.createObjectURL(file);if(file.type.startsWith('video/')){try{const duration=await readVideoDuration(source),maximum=kind==='Promo'?45:600;if(duration>maximum){setError(kind==='Promo'?'One For One videos must be 45 seconds or shorter.':'Uploaded videos must be 10 minutes or shorter.');URL.revokeObjectURL(source);return}}catch(durationError){setError(durationError instanceof Error?durationError.message:'The video duration could not be verified.');URL.revokeObjectURL(source);return}}if(kind==='Promo'){loadPromoFile(file);URL.revokeObjectURL(source);return}setError('');setPreview(source)}
 const upload=async()=>{const safetyError=moderateText(title);if(safetyError){setError(safetyError);return}setUploading(true);setError('');try{const isVideo=kind==='Video'||preview.startsWith('data:video')||preview.startsWith('blob:');if(isVideo){const duration=await readVideoDuration(preview),maximum=kind==='Promo'?45:600;if(duration>maximum)throw new Error(kind==='Promo'?'One For One videos must be 45 seconds or shorter.':'Uploaded videos must be 10 minutes or shorter.')}const media=await uploadMedia(preview,kind.toLowerCase());if(kind==='Promo'){const profile=(()=>{try{return JSON.parse(localStorage.getItem('socialstart-settings-profile')||'{}')}catch{return {}}})();localStorage.setItem(promoKey(),JSON.stringify({title,media,category:category||undefined,hashtags,mediaType:isVideo?'video':'image',views:0,author:profile.name||'SocialStart creator',username:profile.username||'creator',avatar:profile.avatar||''} satisfies Promo));registerPostHashtags(`${title} ${hashtags.map(tag=>`#${tag}`).join(' ')}`,profile.username||'creator');scheduleCloudSave();navigate('/create/one-for-one');return}addUserPost({title,image:media,category:category||undefined,hashtags,mediaType:isVideo?'video':'image'});navigate('/profile')}catch(uploadError){setError(uploadError instanceof Error?uploadError.message:'The upload failed.');setUploading(false)}}

 return <div className="form-page"><p className="eyebrow">CREATE / {kind.toUpperCase()}</p><h1>{kind==='Photo'?'Take a picture':kind==='Video'?'Record a video':`Share a new ${kind.toLowerCase()}`}</h1>
  {isCamera&&!preview?<div className="camera-stage"><video ref={video} muted playsInline/><div className="camera-status">{recording?<><i/> Recording</>:cameraReady?'Camera ready':'Starting camera…'}</div>{kind==='Photo'&&cameraReady&&<button onClick={capturePhoto} className="shutter" aria-label="Take picture"><i/></button>}{kind==='Video'&&recording&&<button onClick={stopRecording} className="stop-recording"><Square/> Stop recording</button>}</div>:<div onClick={()=>input.current?.click()} className="upload-drop">{preview?(kind==='Video'?<video src={preview} controls/>:<img src={preview}/>):<><Upload/><b>Choose {kind==='Video'?'a video':'photo or video'}</b><span>Tap to browse from your device</span></>}</div>}
  {error&&<p className="camera-error">{error}</p>}<input ref={input} hidden type="file" capture={kind==='Photo'?'environment':undefined} accept={kind==='Video'?'video/*':'image/*,video/*'} onChange={e=>chooseFile(e.target.files?.[0])}/>
  {isCamera&&!preview&&<button className="camera-fallback" onClick={()=>input.current?.click()}>Choose from device instead</button>}
  {preview&&<><label className="field">Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Give your post a title…"/></label><CategoryPicker value={category} onChange={setCategory}/><HashtagPicker value={hashtags} onChange={setHashtags}/>{kind==='Story'&&<p className="form-note">Your story will disappear after 24 hours.</p>}<div className="form-actions"><button className="secondary-btn" disabled={uploading} onClick={()=>{setPreview('');if(isCamera)navigate(0)}}><X/> Retake</button><button className="primary-btn" disabled={!title||uploading} onClick={upload}>{uploading?'Uploading…':`Upload ${kind}`}</button></div></>}
  {!preview&&!isCamera&&<><label className="field">Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Give your post a title…"/></label><div className="form-actions"><button className="secondary-btn" onClick={()=>navigate('/create')}><X/> Cancel</button></div></>}
 </div>
}

export function OneForOnePage(){
 const [promo,setPromo]=useState<Promo|null>(readPromo)
 const removePromo=()=>{localStorage.removeItem(promoKey());setPromo(null)}
 return <div className="create-page"><p className="eyebrow">ONE FOR ONE</p><h1>Share attention.<br/><em>Earn attention.</em></h1><p className="lead">Watch a creator’s promo and earn a point. Spend your points to put your own work in front of someone new.</p>{promo&&<section className="own-promo"><p className="promo-view-tracker">Your promo has been viewed <b>{promo.views}</b> {promo.views===1?'time':'times'}</p><article className="promo-post"><header><img src={promo.avatar}/><div><b>{promo.author}</b><span>{promo.username}</span></div></header>{promo.mediaType==='video'?<video src={promo.media} controls playsInline/>:<img src={promo.media} alt={promo.title}/>}<div className="promo-post-copy"><b>{promo.title}</b><span>One For One promo</span></div></article><div className="promo-manage-actions"><button className="delete-product" onClick={removePromo}><Trash2/> Delete promo</button><Link className="secondary-btn" to="/create/one-for-one/upload"><Upload/> Add a new promo</Link></div></section>}<div className="create-grid two">{!promo&&<Link to="/create/one-for-one/upload"><Upload/><b>Add a promo</b><span>Upload a photo or video up to 30 seconds</span></Link>}<Link className="accent" to="/create/one-for-one/earn"><Video/><b>Earn Social Points</b><span>Watch promos from other creators</span></Link></div></div>
}
export function EarnPointsPage(){
 const {points,earnPoint}=useApp(),timer=useRef<ReturnType<typeof setInterval>|null>(null),available=otherPromos()
 const adCountKey=`socialstart-promo-ad-count-${localStorage.getItem('socialstart-active-account')||'guest'}`,adSeenKey=`socialstart-promo-ad-seen-${localStorage.getItem('socialstart-active-account')||'guest'}`
 const [progress,setProgress]=useState(0),[playing,setPlaying]=useState(false),[earned,setEarned]=useState(false),[videoNumber,setVideoNumber]=useState(1),[promosWatched,setPromosWatched]=useState(()=>Number(localStorage.getItem(adCountKey)||0)),[showAd,setShowAd]=useState(false)
 const watchedRef=useRef(promosWatched)
 const selected=available.length?available[(videoNumber-1)%available.length]:null
 useEffect(()=>()=>{if(timer.current)clearInterval(timer.current)},[])
 const play=()=>{if(playing)return;setPlaying(true);setEarned(false);timer.current=setInterval(()=>setProgress(current=>{const next=current+10;if(next>=100){if(timer.current)clearInterval(timer.current);setPlaying(false);setEarned(true);earnPoint();const watched=watchedRef.current+1;watchedRef.current=watched;setPromosWatched(watched);localStorage.setItem(adCountKey,String(watched));if(selected){const updated={...selected.promo,views:selected.promo.views+1};localStorage.setItem(selected.key,JSON.stringify(updated))}return 100}return next}),300)}
 const continueAfterAd=()=>{localStorage.setItem(adSeenKey,String(promosWatched));setShowAd(false);setVideoNumber(current=>current+1);setProgress(0);setEarned(false)}
 const next=()=>{const adDue=promosWatched>0&&promosWatched%10===0&&Number(localStorage.getItem(adSeenKey)||0)!==promosWatched;if(adDue){setShowAd(true);return}setVideoNumber(current=>current+1);setProgress(0);setEarned(false)}
 if(showAd)return <div className="form-page centered"><p className="eyebrow">ADVERTISEMENT BREAK</p><h1>A short break, then back to promos</h1><VideoTestAd placement="break" onComplete={continueAfterAd}/></div>
 return <div className="form-page centered"><p className="eyebrow">EARN SOCIAL POINTS · {points} EARNED</p><h1>Discover something new</h1><div className="promo-card">{selected?(selected.promo.mediaType==='video'?<video src={selected.promo.media} playsInline controls/>:<img src={selected.promo.media}/>):<img src={postsImage}/>} {!playing&&!earned&&<button onClick={play}>▶ Watch promo</button>}{earned&&<strong className="point-earned">✓ Point earned</strong>}<div><b>{selected?.promo.author||'Sunday Studio'} · Promo {videoNumber}</b><span>{selected?.promo.title||'Meet the makers behind every piece.'}</span></div></div><div className="progress"><i style={{width:`${progress}%`}}/></div><p>{progress}% complete · {earned?'Point added to your profile':'Keep this window active'}</p>{earned&&<button className="primary-btn" onClick={next}>{promosWatched>0&&promosWatched%10===0?'Continue to ad':'Play Next'}</button>}</div>
}
const postsImage='https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1000&auto=format&fit=crop'
