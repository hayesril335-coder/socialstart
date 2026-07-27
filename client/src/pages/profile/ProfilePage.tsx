import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bookmark, Grid3X3, MapPin, Moon, Store } from 'lucide-react'
import { posts, profiles } from '../../utils/mockData'
import { useApp } from '../../context/AppContext'
import { PostCard } from '../../components/PostCard'

export function ProfilePage(){
 const {username}=useParams(), own=!username
 const readOwnProfile=()=>{try{return JSON.parse(localStorage.getItem('socialstart-settings-profile')||'{}')}catch{return {}}}
 const [savedProfile,setSavedProfile]=useState<Record<string,string>>(readOwnProfile)
 useEffect(()=>{const update=()=>setSavedProfile(readOwnProfile());window.addEventListener('socialstart-profile-updated',update);return()=>window.removeEventListener('socialstart-profile-updated',update)},[])
 const foundProfile=profiles.find(item=>item.username===username)||profiles[0]
 const profile=own
  ? {name:savedProfile.name||'Alex Morgan',user:savedProfile.username||'alexmorgan',avatar:savedProfile.avatar||'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&auto=format&fit=crop',bio:savedProfile.bio||'Creative director, weekend wanderer, and believer in making the internet feel a little more human.',location:savedProfile.location||'Los Angeles, CA'}
  : {name:foundProfile.name,user:foundProfile.username,avatar:foundProfile.avatar,bio:foundProfile.bio,location:foundProfile.location}
 const {dark,setDark,balance,points,creatorPoints,userPosts,savedPosts,likedPostIds,followingUsernames,toggleFollow,shareCount}=useApp()
 const [tab,setTab]=useState('Posts')
 const totalLikes=userPosts.reduce((total,post)=>total+post.likes+(likedPostIds.includes(post.id)?1:0),0)
 const totalViews=userPosts.reduce((total,post)=>total+Number(post.views),0)
 const stats=own?['0',String(followingUsernames.length),String(totalLikes),String(totalViews)]:['42.1K','318','18.6K','94.2K']
 const visiblePosts=tab==='Saved'?savedPosts:userPosts
 const livePost=!own?posts.find(post=>post.username===profile.user&&post.mediaType==='live'):undefined

 return <div className="profile-page">
  <section className="profile-hero"><Link to={`/profile/${profile.user}/story`} className="avatar-ring" aria-label={`View ${profile.name}'s story`}><img src={profile.avatar}/><i/></Link><div className="profile-main"><p className="eyebrow">@{profile.user}</p><h1>{profile.name}</h1><p className="bio">{profile.bio}</p><p className="location"><MapPin/> {profile.location}</p><div className="profile-buttons">{own?<><Link to="/settings/profile" className="primary-btn">Edit profile</Link><Link to={`/store/${profile.user}/manage`} className="secondary-btn"><Store/> Online store</Link></>:<><button onClick={()=>toggleFollow(profile.user)} className="primary-btn">{followingUsernames.includes(profile.user)?'Following':'Follow'}</button><Link to="/inbox/1" className="secondary-btn">Message</Link><Link to={`/store/${profile.user}`} className="secondary-btn"><Store/> Online store</Link></>}</div></div></section>
  <section className="stat-strip"><div><b>{stats[0]}</b><span>Followers</span></div><div><b>{stats[1]}</b><span>Following</span></div><div><b>{stats[2]}</b><span>Total likes</span></div><div><b>{stats[3]}</b><span>Views</span></div>{own&&<><div><b>{shareCount}</b><span>Shares</span></div><div><b>{points}</b><span>Social points</span></div><div><b>${balance.toFixed(2)}</b><span>Balance</span></div></>}</section>
  {!own&&<div className="creator-point-total"><b>{creatorPoints[profile.user]||0}</b><span> Social Points received</span></div>}
  {livePost&&<section className="profile-live"><p className="eyebrow">STREAMING LIVE NOW</p><PostCard post={livePost}/></section>}
  {own&&<div className="theme-line"><span><Moon/> Appearance</span><button className={dark?'switch on':'switch'} onClick={()=>setDark(!dark)}><i/></button></div>}
  <div className="profile-tabs"><button className={tab==='Posts'?'active':''} onClick={()=>setTab('Posts')}><Grid3X3/> Posts</button>{own&&<button className={tab==='Saved'?'active':''} onClick={()=>setTab('Saved')}><Bookmark/> Saved</button>}</div>
  {own?(visiblePosts.length===0?<div className="profile-empty"><Grid3X3/><h3>{tab==='Posts'?'No posts yet':'Nothing saved yet'}</h3><p>{tab==='Posts'?'When you share your first post, it will appear here.':'Posts you save will appear here.'}</p>{tab==='Posts'&&<Link to="/create" className="primary-btn">Create your first post</Link>}</div>:<div className="profile-post-feed">{visiblePosts.map(p=><PostCard post={p} ownerView={tab==='Posts'} key={p.id}/>)}</div>):<div className="profile-grid">{posts.filter(p=>p.username===profile.user).map(p=><Link to={`/post/${p.id}`} key={p.id}><img src={p.image}/><span>♥ {p.likes.toLocaleString()} · ◉ {p.views}</span></Link>)}</div>}
 </div>
}
