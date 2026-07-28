import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './styles/global.css'
import './styles/fixes.css'
import './styles/ads.css'
import './styles/features.css'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './lib/firebase'
import { prepareCloudAccount } from './lib/cloudSync'
const queryClient=new QueryClient()
const start=()=>ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={queryClient}><App/></QueryClientProvider></React.StrictMode>)
const preventZoom=(event:WheelEvent)=>{if(event.ctrlKey)event.preventDefault()}
const preventZoomKeys=(event:KeyboardEvent)=>{if((event.ctrlKey||event.metaKey)&&['+','-','=','0'].includes(event.key))event.preventDefault()}
document.addEventListener('wheel',preventZoom,{passive:false})
document.addEventListener('keydown',preventZoomKeys)
document.addEventListener('gesturestart',event=>event.preventDefault())
let started=false
onAuthStateChanged(auth,async user=>{
 if(started)return
 started=true
 if(user){
  try{await prepareCloudAccount(user)}catch(error){console.error('SocialStart could not load cloud data',error)}
  if(location.pathname==='/login'||location.pathname==='/signup')history.replaceState(null,'','/search')
 }else if(localStorage.getItem('socialstart-moderator-session')!=='true'){
  localStorage.removeItem('socialstart-authenticated')
  localStorage.removeItem('socialstart-active-account')
 }
 start()
})
