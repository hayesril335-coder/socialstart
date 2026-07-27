import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { prepareCloudAccount } from '../../lib/cloudSync'

type GoogleCredentialResponse={credential:string}
const GOOGLE_CLIENT_ID='1048776122497-o6egk5iaiohriajjdntm8bk3ttkfpmtk.apps.googleusercontent.com'
const authMessage=(error:unknown)=>{
 const code=typeof error==='object'&&error&&'code' in error?String(error.code):''
 if(code.includes('email-already-in-use'))return 'An account already exists for this email. Sign in instead.'
 if(code.includes('invalid-credential'))return 'Incorrect email or password.'
 if(code.includes('popup-closed'))return 'Google sign-in was closed before it finished.'
 if(code.includes('network-request-failed'))return 'Could not reach Firebase. Check your connection and try again.'
 return 'Sign-in could not be completed. Please try again.'
}

export function AuthPage({signup=false}:{signup?:boolean}){
 const [show,setShow]=useState(false),[name,setName]=useState(''),[username,setUsername]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),googleButton=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  let cancelled=false
  const finishGoogle=async(response:GoogleCredentialResponse)=>{
   setBusy(true);setError('')
   try{
    const result=await signInWithCredential(auth,GoogleAuthProvider.credential(response.credential))
    const googleName=result.user.displayName||result.user.email?.split('@')[0]||'SocialStart user'
    const googleUsername=(result.user.email?.split('@')[0]||result.user.uid.slice(0,12)).replace(/[^a-zA-Z0-9._]/g,'')
    await prepareCloudAccount(result.user,{name:googleName,username:googleUsername,email:result.user.email||'',...(result.user.photoURL?{avatar:result.user.photoURL}:{})})
    window.location.replace('/search')
   }catch(authError){setError(authMessage(authError));setBusy(false)}
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
 },[])
 const submit=async()=>{
  setError('')
  if(password.length<8){setError('Password must be at least 8 characters.');return}
  setBusy(true)
  try{
   const normalizedEmail=email.trim().toLowerCase()
   const result=signup?await createUserWithEmailAndPassword(auth,normalizedEmail,password):await signInWithEmailAndPassword(auth,normalizedEmail,password)
   const profile=signup?{name:name.trim(),username:username.trim().replace(/^@/,''),email:normalizedEmail}:undefined
   if(signup&&profile)await updateProfile(result.user,{displayName:profile.name})
   await prepareCloudAccount(result.user,profile)
   window.location.replace('/search')
  }catch(authError){setError(authMessage(authError));setBusy(false)}
 }
 return <div className="auth-page"><section><Link className="wordmark" to="/">SocialStart<span>.</span></Link><p className="eyebrow">{signup?'JOIN THE COMMUNITY':'WELCOME BACK'}</p><h1>{signup?'Your story starts here.':'Good to see you again.'}</h1><p>{signup?'Create, connect, and turn what you love into something more.':'Sign in to pick up where you left off.'}</p><form onSubmit={event=>{event.preventDefault();void submit()}}>{signup&&<><label>Name<input value={name} onChange={event=>setName(event.target.value)} placeholder="Your full name" required/></label><label>Username<input value={username} onChange={event=>setUsername(event.target.value)} placeholder="@yourname" required/></label></>}<label>Email<input value={email} onChange={event=>setEmail(event.target.value)} type="email" placeholder="you@example.com" required/></label><label>Password<div><input value={password} onChange={event=>setPassword(event.target.value)} type={show?'text':'password'} placeholder="At least 8 characters" minLength={8} required/><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label><button className="primary-btn wide" disabled={busy}>{busy?'Please wait…':signup?'Create account':'Sign in'}</button></form><div className="or">OR</div><div className="google-signin" ref={googleButton}/>{error&&<p className="auth-error" role="alert">{error}</p>}<p>{signup?'Already have an account? ':'New to SocialStart? '}<Link to={signup?'/login':'/signup'}>{signup?'Sign in':'Create an account'}</Link></p></section><aside><div><p>“The place where sharing<br/>actually feels <em>human</em>.”</p><span>— The SocialStart community</span></div></aside></div>
}

declare global{
 interface Window{google?:{accounts:{id:{initialize:(config:{client_id:string;callback:(response:GoogleCredentialResponse)=>void})=>void;renderButton:(element:HTMLElement,options:Record<string,string|number>)=>void}}}}
}
