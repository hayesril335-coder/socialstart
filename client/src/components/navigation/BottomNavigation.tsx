import { Camera, Search, Settings, UserRound, MessageCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
const links=[['/profile','Profile',UserRound],['/search','Search',Search],['/create','Post',Camera],['/inbox','Inbox',MessageCircle],['/settings','Settings',Settings]] as const
export function BottomNavigation(){
 const {unread}=useApp()
 return <nav className="bottom-nav">{links.map(([to,label,Icon])=><NavLink key={to} to={to} className={({isActive})=>isActive?'active':''}><span className={label==='Post'?'post-icon':''}><Icon/>{label==='Inbox'&&unread>0?<i>{unread}</i>:null}</span><small>{label}</small></NavLink>)}</nav>
}
