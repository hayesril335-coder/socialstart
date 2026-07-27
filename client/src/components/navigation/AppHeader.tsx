import { Bell, Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
export function AppHeader(){
 const {unread}=useApp()
 return <header className="app-header"><button className="icon-btn" aria-label="Open menu"><Menu/></button><Link className="wordmark" to="/search">SocialStart<span>.</span></Link><Link className="icon-btn notification" to="/notifications" aria-label="Notifications"><Bell/><i>{unread}</i></Link></header>
}
