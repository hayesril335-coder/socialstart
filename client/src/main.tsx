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
let started=false
onAuthStateChanged(auth,async user=>{
 if(started)return
 started=true
 if(user){
  try{await prepareCloudAccount(user)}catch(error){console.error('SocialStart could not load cloud data',error)}
 }else{
  localStorage.removeItem('socialstart-authenticated')
  localStorage.removeItem('socialstart-active-account')
 }
 start()
})
