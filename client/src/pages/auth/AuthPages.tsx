import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
type StoredAccount={name:string;username:string;email:string;passwordHash:string}
type GoogleClaims={aud:string;email:string;email_verified:boolean;exp:number;name?:string;picture?:string;sub:string}
type GoogleCredentialResponse={credential:string}
const GOOGLE_CLIENT_ID='1048776122497-o6egk5iaiohriajjdntm8bk3ttkfpmtk.apps.googleusercontent.com'
const hashPassword=async(password:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password)))).map(byte=>byte.toString(16).padStart(2,'0')).join('')
const readGoogleClaims=(credential:string):GoogleClaims=>{
 const payload=credential.split('.')[1]
 if(!payload)throw new Error('Missing Google credential payload')
 const base64=payload.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(payload.length/4)*4,'=')
 const bytes=Uint8Array.from(atob(base64),character=>character.charCodeAt(0))
 return JSON.parse(new TextDecoder().decode(bytes))
}
const globalKeys=new Set(['socialstart-account','socialstart-accounts','socialstart-authenticated','socialstart-active-account','socialstart-public-posts','socialstart-post-metrics','socialstart-global-creator-points','socialstart-global-follow-graph'])
const isAccountDataKey=(key:string)=>key.startsWith('socialstart-')&&!globalKeys.has(key)&&!key.startsWith('socialstart-account-data-')&&!key.startsWith('socialstart-account-store-')&&!key.startsWith('socialstart-account-promo-')
const switchAccount=(accountId:string,profile:Record<string,string>)=>{
 const previous=localStorage.getItem('socialstart-active-account')
 if(previous&&previous!==accountId){
  const snapshot:Record<string,string>={}
  for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key&&isAccountDataKey(key)){const value=localStorage.getItem(key);if(value!==null)snapshot[key]=value}}
  try{localStorage.setItem(`socialstart-account-data-${previous}`,JSON.stringify(snapshot))}catch{/* Current live data remains available if a large snapshot cannot be copied. */}
 }
 if(previous!==accountId){
  const keys=Array.from({length:localStorage.length},(_,index)=>localStorage.key(index)).filter((key):key is string=>Boolean(key&&isAccountDataKey(key)))
  keys.forEach(key=>localStorage.removeItem(key))
  try{const saved=JSON.parse(localStorage.getItem(`socialstart-account-data-${accountId}`)||'{}') as Record<string,string>;Object.entries(saved).forEach(([key,value])=>localStorage.setItem(key,value))}catch{/* A damaged snapshot starts with clean account data. */}
 }
 let savedProfile:Record<string,string>={}
 try{savedProfile=JSON.parse(localStorage.getItem('socialstart-settings-profile')||'{}')}catch{/* Start with clean profile settings. */}
 localStorage.setItem('socialstart-settings-profile',JSON.stringify({...profile,...savedProfile}))
 localStorage.setItem('socialstart-active-account',accountId)
 localStorage.setItem('socialstart-authenticated','true')
}
export function AuthPage({signup=false}:{signup?:boolean}){
 const [show,setShow]=useState(false),[name,setName]=useState(''),[username,setUsername]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),googleButton=useRef<HTMLDivElement>(null),navigate=useNavigate()
 useEffect(()=>{
  let cancelled=false
  const finishGoogle=(response:GoogleCredentialResponse)=>{
   try{
    const claims=readGoogleClaims(response.credential)
    if(claims.aud!==GOOGLE_CLIENT_ID||!claims.email_verified||claims.exp*1000<=Date.now()){setError('Google returned an invalid or expired sign-in. Please try again.');return}
    const googleName=claims.name||claims.email.split('@')[0],googleUsername=claims.email.split('@')[0].replace(/[^a-zA-Z0-9._]/g,'')
    try{switchAccount(`google-${claims.sub}`,{name:googleName,username:googleUsername,email:claims.email,...(claims.picture?{avatar:claims.picture}:{})})}
    catch{setError('Google signed you in, but this browser could not save the account. Clear some site data and try again.');return}
    window.location.replace('/search')
   }catch{setError('Google could not read the sign-in response. Please try again.')}
  }
  const render=()=>{
   if(cancelled||!googleButton.current||!window.google)return
   window.google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:finishGoogle})
   window.google.accounts.id.renderButton(googleButton.current,{theme:'outline',size:'large',text:'continue_with',shape:'rectangular',width:400})
  }
  if(window.google)render()
  else{
   const existing=document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]')
   const script=existing||Object.assign(document.createElement('script'),{src:'https://accounts.google.com/gsi/client',async:true,defer:true})
   script.addEventListener('load',render,{once:true})
   if(!existing)document.head.appendChild(script)
  }
  return()=>{cancelled=true}
 },[navigate])
 const submit=async()=>{
  setError('')
  if(password.length<8){setError('Password must be at least 8 characters.');return}
  const normalizedEmail=email.trim().toLowerCase(),passwordHash=await hashPassword(password)
  if(signup){
   const account:StoredAccount={name:name.trim(),username:username.trim().replace(/^@/,''),email:normalizedEmail,passwordHash}
   const accounts=JSON.parse(localStorage.getItem('socialstart-accounts')||'{}') as Record<string,StoredAccount>
   accounts[normalizedEmail]=account
   localStorage.setItem('socialstart-accounts',JSON.stringify(accounts))
   switchAccount(`email-${normalizedEmail}`,{name:account.name,username:account.username,email:account.email})
  }else{
   let account:StoredAccount|null=null
   try{account=(JSON.parse(localStorage.getItem('socialstart-accounts')||'{}') as Record<string,StoredAccount>)[normalizedEmail]||JSON.parse(localStorage.getItem('socialstart-account')||'null')}catch{/* Invalid stored account is treated as missing. */}
   if(!account){setError('No account was found. Create an account first.');return}
   if(account.email!==normalizedEmail||account.passwordHash!==passwordHash){setError('Incorrect email or password.');return}
   switchAccount(`email-${normalizedEmail}`,{name:account.name,username:account.username,email:account.email})
  }
  window.location.replace('/search')
 }
 return <div className="auth-page"><section><Link className="wordmark" to="/">SocialStart<span>.</span></Link><p className="eyebrow">{signup?'JOIN THE COMMUNITY':'WELCOME BACK'}</p><h1>{signup?'Your story starts here.':'Good to see you again.'}</h1><p>{signup?'Create, connect, and turn what you love into something more.':'Sign in to pick up where you left off.'}</p><form onSubmit={e=>{e.preventDefault();void submit()}}>{signup&&<><label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" required/></label><label>Username<input value={username} onChange={e=>setUsername(e.target.value)} placeholder="@yourname" required/></label></>}<label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" required/></label><label>Password<div><input value={password} onChange={e=>setPassword(e.target.value)} type={show?'text':'password'} placeholder="At least 8 characters" minLength={8} required/><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label><button className="primary-btn wide">{signup?'Create account':'Sign in'}</button></form><div className="or">OR</div><div className="google-signin" ref={googleButton}/>{error&&<p className="auth-error" role="alert">{error}</p>}<p>{signup?'Already have an account? ':'New to SocialStart? '}<Link to={signup?'/login':'/signup'}>{signup?'Sign in':'Create an account'}</Link></p></section><aside><div><p>“The place where sharing<br/>actually feels <em>human</em>.”</p><span>— The SocialStart community</span></div></aside></div>
}

declare global{
 interface Window{google?:{accounts:{id:{initialize:(config:{client_id:string;callback:(response:GoogleCredentialResponse)=>void})=>void;renderButton:(element:HTMLElement,options:Record<string,string|number>)=>void}}}}
}
