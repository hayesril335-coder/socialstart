import { Bell, Moon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
export function AppHeader(){
 const {unread,dark,setDark}=useApp()
 return <header className="app-header"><button className="header-theme" onClick={()=>setDark(!dark)} aria-label="Toggle appearance"><Moon/><i className={dark?'switch on':'switch'}><i/></i></button><Link className="wordmark" to="/search">SocialStart<span>.</span></Link><Link className="icon-btn notification" to="/notifications" aria-label="Notifications"><Bell/>{unread>0&&<i>{unread}</i>}</Link></header>
}
