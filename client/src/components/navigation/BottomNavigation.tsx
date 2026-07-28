import { Camera, Search, UserRound, MessageCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
const EarnIcon=()=> <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h3v12M14 6h3v12M9 8l3-2 3 2M15 16l-3 2-3-2M8 12h8"/></svg>
const links=[['/profile','Profile',UserRound],['/search','Search',Search],['/create','Post',Camera],['/inbox','Inbox',MessageCircle],['/create/one-for-one','Earn',EarnIcon]] as const
export function BottomNavigation(){
 const {unread}=useApp()
 return <nav className="bottom-nav">{links.map(([to,label,Icon])=><NavLink key={to} to={to} end={label==='Post'} className={({isActive})=>isActive?'active':''}><span className={label==='Post'?'post-icon':label==='Earn'?'earn-icon':''}><Icon/>{label==='Inbox'&&unread>0?<i>{unread}</i>:null}</span><small>{label}</small></NavLink>)}</nav>
}
