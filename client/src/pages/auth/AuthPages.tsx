import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut, updateProfile } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { prepareCloudAccount, stopCloudSync } from '../../lib/cloudSync'

const moderatorEmail='moderator@socialstart.app'
const moderatorPassword='SocialStartMod2026!'
const moderatorAccountId='socialstart-moderator-v2'
const moderatorResetKeys=['socialstart-settings-profile','socialstart-user-posts','socialstart-saved-posts','socialstart-liked-posts','socialstart-viewed-posts','socialstart-following','socialstart-cart','socialstart-locked-posts','socialstart-purchased-posts','socialstart-post-metrics','socialstart-membership-plans','socialstart-membership-purchases','socialstart-points','socialstart-points-used','socialstart-balance']

const authMessage=(error:unknown)=>{
 const code=typeof error==='object'&&error&&'code' in error?String(error.code):''
 if(code.includes('email-already-in-use'))return 'An account already exists for this email. Sign in instead.'
 if(code.includes('invalid-credential'))return 'Incorrect email or password.'
 if(code.includes('operation-not-allowed'))return 'That sign-in method is not enabled yet.'
 if(code.includes('weak-password'))return 'Use a stronger password with at least 8 characters.'
 if(code.includes('popup-blocked'))return 'Opening Google sign-in in this window…'
 if(code.includes('popup-closed'))return 'Google sign-in was closed before it finished.'
 if(code.includes('too-many-requests'))return 'Too many attempts were made. Wait a few minutes, then try again.'
 if(code.includes('unauthorized-domain'))return 'This SocialStart address is not authorized for Google sign-in.'
 if(code.includes('network-request-failed'))return 'Could not reach Firebase. Check your connection and try again.'
 return 'Sign-in could not be completed. Please try again.'
}

const finishSignIn=async(user:Parameters<typeof prepareCloudAccount>[0],profile?:Record<string,string>)=>{
 try{
  await Promise.race([
   prepareCloudAccount(user,profile),
   new Promise((_,reject)=>window.setTimeout(()=>reject(new Error('Cloud sync timed out')),12_000)),
  ])
 }catch(syncError){
  console.error('SocialStart signed in, but account data will retry after loading.',syncError)
  localStorage.setItem('socialstart-active-account',user.uid)
  localStorage.setItem('socialstart-authenticated','true')
 }
 window.location.replace('/search')
}

export function AuthPage({signup=false}:{signup?:boolean}){
 const [show,setShow]=useState(false),[name,setName]=useState(''),[username,setUsername]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const googleSignIn=async()=>{
 setBusy(true);setError('')
 try{
   stopCloudSync()
   if(localStorage.getItem('socialstart-moderator-session')==='true'){
    moderatorResetKeys.forEach(key=>localStorage.removeItem(key))
    localStorage.removeItem('socialstart-moderator-session')
    localStorage.removeItem('socialstart-active-account')
   }
   const provider=new GoogleAuthProvider()
   provider.setCustomParameters({prompt:'select_account'})
   const result=await signInWithPopup(auth,provider)
   const googleName=result.user.displayName||result.user.email?.split('@')[0]||'SocialStart user'
   const googleUsername=(result.user.email?.split('@')[0]||result.user.uid.slice(0,12)).replace(/[^a-zA-Z0-9._]/g,'')
   await finishSignIn(result.user,{name:googleName,username:googleUsername,email:result.user.email||'',...(result.user.photoURL?{avatar:result.user.photoURL}:{})})
  }catch(authError){
   const code=typeof authError==='object'&&authError&&'code' in authError?String(authError.code):''
   if(code.includes('popup-blocked')){
    try{await signInWithRedirect(auth,new GoogleAuthProvider());return}catch(redirectError){setError(authMessage(redirectError))}
   }else setError(authMessage(authError))
   setBusy(false)
  }
 }
 const submit=async()=>{
  setError('')
  if(password.length<8){setError('Password must be at least 8 characters.');return}
  setBusy(true)
  try{
   const normalizedEmail=email.trim().toLowerCase()
   if(!signup&&normalizedEmail===moderatorEmail&&password===moderatorPassword){
    stopCloudSync()
    await signOut(auth)
    const snapshot=localStorage.getItem(`socialstart-account-data-${moderatorAccountId}`)
    moderatorResetKeys.forEach(key=>localStorage.removeItem(key))
    if(snapshot){
     const state=JSON.parse(snapshot) as Record<string,string>
     Object.entries(state).forEach(([key,value])=>localStorage.setItem(key,value))
    }else{
     localStorage.setItem('socialstart-settings-profile',JSON.stringify({name:'SocialStart Moderator',username:'socialstartmod',email:moderatorEmail,bio:'SocialStart community moderator.',location:'SocialStart'}))
     localStorage.setItem('socialstart-points','1000')
     localStorage.setItem('socialstart-balance','1000')
    }
    localStorage.setItem('socialstart-active-account',moderatorAccountId)
    localStorage.setItem('socialstart-moderator-session','true')
    localStorage.setItem('socialstart-authenticated','true')
    window.location.replace('/search')
    return
   }
   if(localStorage.getItem('socialstart-moderator-session')==='true'){
    moderatorResetKeys.forEach(key=>localStorage.removeItem(key))
    localStorage.removeItem('socialstart-moderator-session')
    localStorage.removeItem('socialstart-active-account')
   }
   stopCloudSync()
   if(auth.currentUser&&auth.currentUser.email?.toLowerCase()!==normalizedEmail)await signOut(auth)
   const result=signup?await createUserWithEmailAndPassword(auth,normalizedEmail,password):await signInWithEmailAndPassword(auth,normalizedEmail,password)
   const profile=signup?{name:name.trim(),username:username.trim().replace(/^@/,''),email:normalizedEmail}:undefined
   if(signup&&profile)await updateProfile(result.user,{displayName:profile.name})
   await finishSignIn(result.user,profile)
  }catch(authError){setError(authMessage(authError));setBusy(false)}
 }
 return <div className="auth-page"><section><Link className="wordmark" to="/">SocialStart<span>.</span></Link><p className="eyebrow">{signup?'JOIN THE COMMUNITY':'WELCOME BACK'}</p><h1>{signup?'Your story starts here.':'Good to see you again.'}</h1><p>{signup?'Create, connect, and turn what you love into something more.':'Sign in to pick up where you left off.'}</p><form onSubmit={event=>{event.preventDefault();void submit()}}>{signup&&<><label>Name<input value={name} onChange={event=>setName(event.target.value)} placeholder="Your full name" required/></label><label>Username<input value={username} onChange={event=>setUsername(event.target.value)} placeholder="@yourname" required/></label></>}<label>Email<input value={email} onChange={event=>setEmail(event.target.value)} type="email" placeholder="you@example.com" required/></label><label>Password<div><input value={password} onChange={event=>setPassword(event.target.value)} type={show?'text':'password'} placeholder="At least 8 characters" minLength={8} required/><button type="button" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label><button className="primary-btn wide" disabled={busy}>{busy?'Please wait…':signup?'Create account':'Sign in'}</button></form><div className="or">OR</div><button type="button" className="secondary-btn wide google-signin" disabled={busy} onClick={()=>void googleSignIn()}>Continue with Google</button>{error&&<p className="auth-error" role="alert">{error}</p>}<p>{signup?'Already have an account? ':'New to SocialStart? '}<Link to={signup?'/login':'/signup'}>{signup?'Sign in':'Create an account'}</Link></p></section><aside><div><p>“The place where sharing<br/>actually feels <em>human</em>.”</p><span>— The SocialStart community</span></div></aside></div>
}
