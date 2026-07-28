import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppHeader } from '../components/navigation/AppHeader'
import { BottomNavigation } from '../components/navigation/BottomNavigation'
export function MainAppLayout(){
 const key=`socialstart-onboarding-seen-${localStorage.getItem('socialstart-active-account')||'guest'}`
 const [step,setStep]=useState(()=>localStorage.getItem(key)?0:1)
 const advance=()=>{if(step===1)setStep(2);else{localStorage.setItem(key,'true');setStep(0)}}
 return <div className="app-shell"><AppHeader/><main><Outlet/></main><BottomNavigation/>{step>0&&<button className={`onboarding-tip step-${step}`} onClick={advance}><span>{step===1?'Have a question? Tap Inbox anytime and ask the SocialStart Welcome Bot.':'Tap 141 to gain photo and video views simply by watching other creators.'}</span><i>Tap anywhere to continue</i></button>}</div>
}
