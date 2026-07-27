import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
export function AppHeader(){
 const {unread}=useApp()
 return <header className="app-header"><span className="header-spacer"/><Link className="wordmark" to="/search">SocialStart<span>.</span></Link><Link className="icon-btn notification" to="/notifications" aria-label="Notifications"><Bell/>{unread>0&&<i>{unread}</i>}</Link></header>
}
