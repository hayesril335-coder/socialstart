import { Moon, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
export function AppHeader(){
 const {dark,setDark}=useApp()
 return <header className="app-header"><button className="header-theme" onClick={()=>setDark(!dark)} aria-label="Toggle appearance"><Moon/><i className={dark?'switch on':'switch'}><i/></i></button><Link className="wordmark" to="/search">SocialStart</Link><Link className="icon-btn" to="/settings" aria-label="Settings"><Settings/></Link></header>
}
