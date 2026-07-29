import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ChevronRight, CircleDollarSign, CreditCard, Headphones, LockKeyhole, LogOut, MapPin, Mic, Moon, UserRound, WalletCards } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { signOut } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { flushCloudSave, scheduleCloudSave, stopCloudSync } from '../../lib/cloudSync'
import { uploadMedia } from '../../lib/mediaStorage'
import { formatCurrency } from '../../lib/format'

type Values=Record<string,string>
const defaults:Record<string,Values>={
 Profile:{name:'Alex Morgan',username:'alexmorgan',avatar:'',bio:'Creative director, weekend wanderer, and believer in making the internet feel a little more human.',location:'Los Angeles, CA'},
 Account:{email:'alex@example.com',phone:'',password:''},
 Security:{currentPassword:'',newPassword:'',confirmPassword:''},
 Billing:{cardName:'',cardNumber:'',expiry:'',cvv:''},
 Address:{street:'',city:'Los Angeles',region:'CA',postalCode:'',country:'United States'}
}
const labels:Record<string,Record<string,string>>={
 Profile:{name:'Name',username:'Username',bio:'About you',location:'Location'},
 Account:{email:'Email address',phone:'Phone number',password:'Password'},
 Security:{currentPassword:'Current password',newPassword:'New password',confirmPassword:'Confirm new password'},
 Billing:{cardName:'Name on card',cardNumber:'Card number',expiry:'Expiration date',cvv:'Security code'},
 Address:{street:'Street address',city:'City',region:'State / region',postalCode:'Postal code',country:'Country'}
}
const storageKey=(type:string)=>`socialstart-settings-${type.toLowerCase()}`
const readValues=(type:string)=>{try{const values={...defaults[type],...JSON.parse(localStorage.getItem(storageKey(type))||'')};return type==='Profile'?{...values,bio:(values.bio||'').slice(0,80)}:values}catch{return defaults[type]}}

export function SettingsPage(){
 const {dark,setDark}=useApp(),navigate=useNavigate()
 const items=[['/settings/profile','Edit profile',UserRound],['/settings/account','Account details',LockKeyhole],['/settings/security','Security',LockKeyhole],['/settings/billing','Billing details',CreditCard],['/settings/address','Addresses',MapPin],['/settings/devices','Devices',Headphones],['/settings/wallet','Wallet',WalletCards]] as const
 const logout=async()=>{
  const moderatorSession=localStorage.getItem('socialstart-moderator-session')==='true'
  if(moderatorSession){
   const keys=['socialstart-settings-profile','socialstart-user-posts','socialstart-saved-posts','socialstart-liked-posts','socialstart-viewed-posts','socialstart-following','socialstart-cart','socialstart-locked-posts','socialstart-purchased-posts','socialstart-post-metrics','socialstart-membership-plans','socialstart-membership-purchases','socialstart-points','socialstart-points-used','socialstart-balance']
   const snapshot:Record<string,string>={}
   keys.forEach(key=>{const value=localStorage.getItem(key);if(value!==null)snapshot[key]=value})
   localStorage.setItem('socialstart-account-data-socialstart-moderator-v2',JSON.stringify(snapshot))
  }
 if(!moderatorSession){
   const accountId=localStorage.getItem('socialstart-active-account')
   if(accountId){
    const snapshot:Record<string,string>={}
    for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key?.startsWith('socialstart-')&&!key.startsWith('socialstart-account-data-')){const value=localStorage.getItem(key);if(value!==null)snapshot[key]=value}}
    localStorage.setItem(`socialstart-account-data-${accountId}`,JSON.stringify(snapshot))
   }
   scheduleCloudSave()
   await flushCloudSave().catch(()=>undefined)
  }
  stopCloudSync()
  await signOut(auth)
  if(moderatorSession){
   const keys=['socialstart-settings-profile','socialstart-user-posts','socialstart-saved-posts','socialstart-liked-posts','socialstart-viewed-posts','socialstart-following','socialstart-cart','socialstart-locked-posts','socialstart-purchased-posts','socialstart-post-metrics','socialstart-membership-plans','socialstart-membership-purchases','socialstart-points','socialstart-points-used','socialstart-balance']
   keys.forEach(key=>localStorage.removeItem(key))
  }
  localStorage.removeItem('socialstart-authenticated');localStorage.removeItem('socialstart-active-account');localStorage.removeItem('socialstart-moderator-session');sessionStorage.clear();navigate('/login',{replace:true})
 }
 return <div className="settings-page"><p className="eyebrow">YOUR SPACE</p><h1>Settings</h1><section><p className="eyebrow">ACCOUNT</p>{items.map(([to,label,Icon])=><Link to={to} key={to}><Icon/><span>{label}</span><ChevronRight/></Link>)}</section><section><p className="eyebrow">PREFERENCES</p><button onClick={()=>setDark(!dark)}><Moon/><span>Dark mode</span><i className={dark?'switch on':'switch'}><i/></i></button></section><button className="logout" onClick={logout}><LogOut/> Log out</button></div>
}

export function SettingsDetailPage({type}:{type:string}){
 const {balance,addFunds}=useApp()
 const photoInput=useRef<HTMLInputElement>(null)
 const [values,setValues]=useState<Values>(()=>readValues(type)),[message,setMessage]=useState(''),[walletAmount,setWalletAmount]=useState('')
 const [devices,setDevices]=useState<MediaDeviceInfo[]>([]),[devicePrefs,setDevicePrefs]=useState(()=>readValues('Devices'))
 useEffect(()=>{if(type!=='Devices')return;void navigator.mediaDevices?.enumerateDevices().then(setDevices).catch(()=>setDevices([]))},[type])
 if(type==='Devices'){const microphones=devices.filter(device=>device.kind==='audioinput'),speakers=devices.filter(device=>device.kind==='audiooutput');return <div className="form-page"><p className="eyebrow">SETTINGS / DEVICES</p><h1>Microphone & speaker</h1><label className="field"><Mic/> Microphone<select value={devicePrefs.microphone||''} onChange={event=>setDevicePrefs({...devicePrefs,microphone:event.target.value})}><option value="">System default</option>{microphones.map((device,index)=><option value={device.deviceId} key={device.deviceId}>{device.label||`Microphone ${index+1}`}</option>)}</select></label><label className="field"><Headphones/> Speaker<select value={devicePrefs.speaker||''} onChange={event=>setDevicePrefs({...devicePrefs,speaker:event.target.value})}><option value="">System default</option>{speakers.map((device,index)=><option value={device.deviceId} key={device.deviceId}>{device.label||`Speaker ${index+1}`}</option>)}</select></label><button className="primary-btn settings-save" onClick={()=>{localStorage.setItem(storageKey('Devices'),JSON.stringify(devicePrefs));scheduleCloudSave();setMessage('Device preferences saved.')}}>Save devices</button>{message&&<p className="save-success">{message}</p>}</div>}
 if(type==='Wallet')return <div className="form-page"><p className="eyebrow">SETTINGS / WALLET</p><h1>Your wallet</h1><div className="balance-card"><span>AVAILABLE BALANCE</span><b>{formatCurrency(balance)}</b><small>Ready to spend or tip</small></div><label className="field">Add funds<input type="number" min="1" value={walletAmount} onChange={event=>setWalletAmount(event.target.value)} placeholder="$0.00"/></label><button className="primary-btn wide" disabled={Number(walletAmount)<=0} onClick={()=>{addFunds(Number(walletAmount));setMessage(`${formatCurrency(Number(walletAmount))} added to your wallet.`);setWalletAmount('')}}><CircleDollarSign/> Continue</button>{message&&<p className="save-success">{message}</p>}<h3>Recent activity</h3><div className="profile-empty"><p>No wallet activity yet.</p></div></div>
 const loadProfilePhoto=(file:File)=>{const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const size=Math.min(400,Math.max(image.width,image.height)),scale=size/Math.max(image.width,image.height),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d')?.drawImage(image,0,0,canvas.width,canvas.height);setValues(current=>({...current,avatar:canvas.toDataURL('image/jpeg',.78)}))};image.src=String(reader.result)};reader.readAsDataURL(file)}
 const submit=async(event:FormEvent)=>{event.preventDefault();if(type==='Security'&&values.newPassword!==values.confirmPassword){setMessage('New passwords do not match.');return}try{setMessage('Saving…');const limitedValues=type==='Profile'?{...values,bio:(values.bio||'').slice(0,80)}:values;const savedValues=type==='Profile'&&limitedValues.avatar?.startsWith('data:')?{...limitedValues,avatar:await uploadMedia(limitedValues.avatar,'profile')}:limitedValues;localStorage.setItem(storageKey(type),JSON.stringify(savedValues));setValues(savedValues);scheduleCloudSave();if(type==='Profile')window.dispatchEvent(new Event('socialstart-profile-updated'));setMessage(`${type} changes saved.`)}catch(error){setMessage(error instanceof Error?error.message:'That image could not be saved.')}}
 return <form className="form-page" onSubmit={submit}><p className="eyebrow">SETTINGS / {type.toUpperCase()}</p><h1>{type==='Address'?'Addresses':type}</h1>
  {type==='Profile'&&<div className="profile-photo-editor">{values.avatar?<img src={values.avatar} alt="New profile"/>:<UserRound/>}<input ref={photoInput} hidden type="file" accept="image/*" onChange={event=>{const file=event.target.files?.[0];if(file)loadProfilePhoto(file)}}/><button type="button" className="secondary-btn" onClick={()=>photoInput.current?.click()}>Change profile picture</button></div>}
  {Object.entries(values).filter(([key])=>key!=='avatar').map(([key,value])=><label className="field" key={key}>{labels[type]?.[key]||key}{key==='bio'?<><textarea maxLength={80} value={value} onChange={e=>setValues({...values,[key]:e.target.value.slice(0,80)})}/><small className="character-count">{value.length}/80</small></>:<input value={value} required={key!=='phone'} type={key.toLowerCase().includes('password')||key==='cvv'?'password':key==='email'?'email':'text'} autoComplete="off" onChange={e=>setValues({...values,[key]:e.target.value})}/>}</label>)}
  <button className="primary-btn settings-save" type="submit">Save changes</button>{message&&<p className={message.includes('match')?'camera-error':'save-success'}>{message}</p>}
 </form>
}
