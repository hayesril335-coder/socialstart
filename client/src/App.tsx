import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AppRoutes } from './routes/AppRoutes'
export default function App(){
 useEffect(()=>{
  const checkForUpdate=async()=>{
   try{
    const html=await fetch(`/?update=${Date.now()}`,{cache:'no-store'}).then(response=>response.text())
    const latest=html.match(/\/assets\/index-[^"]+\.js/)?.[0],current=document.querySelector<HTMLScriptElement>('script[type="module"]')?.src
    if(latest&&current&&!current.endsWith(latest))window.location.reload()
   }catch{/* Stay on the current version while offline. */}
  }
  const onVisible=()=>{if(document.visibilityState==='visible')void checkForUpdate()}
  document.addEventListener('visibilitychange',onVisible)
  const timer=window.setInterval(checkForUpdate,60000)
  return()=>{document.removeEventListener('visibilitychange',onVisible);window.clearInterval(timer)}
 },[])
 return <BrowserRouter><AppProvider><AppRoutes/></AppProvider></BrowserRouter>
}
