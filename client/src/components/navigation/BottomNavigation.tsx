import { Camera, Search, UserRound, MessageCircle } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
const EarnIcon=()=> <svg viewBox="0 0 30 20" aria-hidden="true"><text x="15" y="15" textAnchor="middle">141</text></svg>
const links=[['/profile','Profile',UserRound],['/search','Search',Search],['/create','Post',Camera],['/inbox','Inbox',MessageCircle],['/create/one-for-one','Earn',EarnIcon]] as const
export function BottomNavigation(){
 const {unread}=useApp()
 return <nav className="bottom-nav">{links.map(([to,label,Icon])=><NavLink key={to} to={to} end={label==='Post'} className={({isActive})=>isActive?'active':''}><span className={label==='Post'?'post-icon':label==='Earn'?'earn-icon':''}><Icon/>{label==='Inbox'&&unread>0?<i>{unread}</i>:null}</span><small>{label}</small></NavLink>)}</nav>
}
