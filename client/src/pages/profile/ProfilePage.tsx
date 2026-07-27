import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Grid3X3, Bookmark, MapPin, Moon, Store } from 'lucide-react'
import { posts } from '../../utils/mockData'
import { useApp } from '../../context/AppContext'
export function ProfilePage(){
 const {username}=useParams(), own=!username
 const profile=own?{name:'Alex Morgan',user:'alexmorgan',avatar:'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&auto=format&fit=crop',bio:'Creative director, weekend wanderer, and believer in making the internet feel a little more human.',location:'Los Angeles, CA'}:{name:'Sofia Bell',user:'sofiabell',avatar:posts[0].avatar,bio:'Light chaser. Storyteller. Taking the scenic route, always.',location:'Silver Lake, CA'}
 const {dark,setDark,balance,points}=useApp(); const [tab,setTab]=useState('Posts'),[following,setFollowing]=useState(false)
 return <div className="profile-page"><section className="profile-hero"><div className="avatar-ring"><img src={profile.avatar}/><i/></div><div className="profile-main"><p className="eyebrow">@{profile.user}</p><h1>{profile.name}</h1><p className="bio">{profile.bio}</p><p className="location"><MapPin/> {profile.location}</p><div className="profile-buttons">{own?<><Link to="/settings/profile" className="primary-btn">Edit profile</Link><Link to={`/store/${profile.user}`} className="secondary-btn"><Store/> Online store</Link></>:<><button onClick={()=>setFollowing(!following)} className="primary-btn">{following?'Following':'Follow'}</button><Link to="/inbox/1" className="secondary-btn">Message</Link></>}</div></div></section>
 <section className="stat-strip"><div><b>12.8K</b><span>Followers</span></div><div><b>846</b><span>Following</span></div><div><b>72.4K</b><span>Total likes</span></div><div><b>1.2M</b><span>Views</span></div>{own&&<><div><b>{points}</b><span>Social points</span></div><div><b>${balance.toFixed(2)}</b><span>Balance</span></div></>}</section>
 {own&&<div className="theme-line"><span><Moon/> Appearance</span><button className={dark?'switch on':'switch'} onClick={()=>setDark(!dark)}><i/></button></div>}
 <div className="profile-tabs"><button className={tab==='Posts'?'active':''} onClick={()=>setTab('Posts')}><Grid3X3/> Posts</button>{own&&<button className={tab==='Saved'?'active':''} onClick={()=>setTab('Saved')}><Bookmark/> Saved</button>}</div>
 <div className="profile-grid">{(tab==='Saved'?[posts[1],posts[2]]:posts).map(p=><Link to={`/post/${p.id}`} key={p.id}><img src={p.image}/><span>♥ {p.likes.toLocaleString()} · ◉ {p.views}</span></Link>)}</div></div>
}
