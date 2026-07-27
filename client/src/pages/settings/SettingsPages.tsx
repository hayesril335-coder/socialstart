import { useRef, useState, type FormEvent } from 'react'
import { ChevronRight, CircleDollarSign, CreditCard, LockKeyhole, LogOut, MapPin, Moon, UserRound, WalletCards } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

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
const readValues=(type:string)=>{try{return {...defaults[type],...JSON.parse(localStorage.getItem(storageKey(type))||'{}')}}catch{return defaults[type]}}

export function SettingsPage(){
 const {dark,setDark}=useApp(),navigate=useNavigate()
 const items=[['/settings/profile','Edit profile',UserRound],['/settings/account','Account details',LockKeyhole],['/settings/security','Security',LockKeyhole],['/settings/billing','Billing details',CreditCard],['/settings/address','Addresses',MapPin],['/settings/wallet','Wallet',WalletCards]] as const
 const logout=()=>{
  const accountId=localStorage.getItem('socialstart-active-account')
  if(accountId){
   const globalKeys=new Set(['socialstart-account','socialstart-accounts','socialstart-authenticated','socialstart-active-account','socialstart-public-posts','socialstart-post-metrics','socialstart-global-creator-points'])
   const snapshot:Record<string,string>={}
   for(let index=0;index<localStorage.length;index++){
    const key=localStorage.key(index)
    if(key?.startsWith('socialstart-')&&!globalKeys.has(key)&&!key.startsWith('socialstart-account-data-')){
     const value=localStorage.getItem(key)
     if(value!==null)snapshot[key]=value
    }
   }
   try{localStorage.setItem(`socialstart-account-data-${accountId}`,JSON.stringify(snapshot))}catch{/* Live account data remains in local storage if a large snapshot cannot be copied. */}
  }
  localStorage.removeItem('socialstart-authenticated');sessionStorage.clear();navigate('/login',{replace:true})
 }
 return <div className="settings-page"><p className="eyebrow">YOUR SPACE</p><h1>Settings</h1><section><p className="eyebrow">ACCOUNT</p>{items.map(([to,label,Icon])=><Link to={to} key={to}><Icon/><span>{label}</span><ChevronRight/></Link>)}</section><section><p className="eyebrow">PREFERENCES</p><button onClick={()=>setDark(!dark)}><Moon/><span>Dark mode</span><i className={dark?'switch on':'switch'}><i/></i></button></section><button className="logout" onClick={logout}><LogOut/> Log out</button></div>
}

export function SettingsDetailPage({type}:{type:string}){
 const {balance,addFunds}=useApp()
 const photoInput=useRef<HTMLInputElement>(null)
 const [values,setValues]=useState<Values>(()=>readValues(type)),[message,setMessage]=useState(''),[walletAmount,setWalletAmount]=useState('')
 if(type==='Wallet')return <div className="form-page"><p className="eyebrow">SETTINGS / WALLET</p><h1>Your wallet</h1><div className="balance-card"><span>AVAILABLE BALANCE</span><b>${balance.toFixed(2)}</b><small>Ready to spend or tip</small></div><label className="field">Add funds<input type="number" min="1" value={walletAmount} onChange={event=>setWalletAmount(event.target.value)} placeholder="$0.00"/></label><button className="primary-btn wide" disabled={Number(walletAmount)<=0} onClick={()=>{addFunds(Number(walletAmount));setMessage(`$${Number(walletAmount).toFixed(2)} added to your wallet.`);setWalletAmount('')}}><CircleDollarSign/> Continue</button>{message&&<p className="save-success">{message}</p>}<h3>Recent activity</h3><div className="profile-empty"><p>No wallet activity yet.</p></div></div>
 const loadProfilePhoto=(file:File)=>{const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const size=Math.min(400,Math.max(image.width,image.height)),scale=size/Math.max(image.width,image.height),canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d')?.drawImage(image,0,0,canvas.width,canvas.height);setValues(current=>({...current,avatar:canvas.toDataURL('image/jpeg',.78)}))};image.src=String(reader.result)};reader.readAsDataURL(file)}
 const submit=(event:FormEvent)=>{event.preventDefault();if(type==='Security'&&values.newPassword!==values.confirmPassword){setMessage('New passwords do not match.');return}try{localStorage.setItem(storageKey(type),JSON.stringify(values));if(type==='Profile')window.dispatchEvent(new Event('socialstart-profile-updated'));setMessage(`${type} changes saved.`)}catch{setMessage('That image is too large to save. Please choose a smaller photo.')}}
 return <form className="form-page" onSubmit={submit}><p className="eyebrow">SETTINGS / {type.toUpperCase()}</p><h1>{type==='Address'?'Addresses':type}</h1>
  {type==='Profile'&&<div className="profile-photo-editor">{values.avatar?<img src={values.avatar} alt="New profile"/>:<UserRound/>}<input ref={photoInput} hidden type="file" accept="image/*" onChange={event=>{const file=event.target.files?.[0];if(file)loadProfilePhoto(file)}}/><button type="button" className="secondary-btn" onClick={()=>photoInput.current?.click()}>Change profile picture</button></div>}
  {Object.entries(values).filter(([key])=>key!=='avatar').map(([key,value])=><label className="field" key={key}>{labels[type]?.[key]||key}{key==='bio'?<textarea value={value} onChange={e=>setValues({...values,[key]:e.target.value})}/>:<input value={value} required={key!=='phone'} type={key.toLowerCase().includes('password')||key==='cvv'?'password':key==='email'?'email':'text'} autoComplete="off" onChange={e=>setValues({...values,[key]:e.target.value})}/>}</label>)}
  <button className="primary-btn settings-save" type="submit">Save changes</button>{message&&<p className={message.includes('match')?'camera-error':'save-success'}>{message}</p>}
 </form>
}
