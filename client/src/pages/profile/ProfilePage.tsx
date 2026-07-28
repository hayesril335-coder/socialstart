import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bookmark, Crown, Grid3X3, Hash, MapPin, Store, X } from 'lucide-react'
import { posts, profiles } from '../../utils/mockData'
import { useApp } from '../../context/AppContext'
import { PostCard } from '../../components/PostCard'
import { activeMembershipFor, membershipPlanFor } from '../../lib/memberships'
import { formatCount, formatCurrency } from '../../lib/format'

export function ProfilePage(){
 const {username}=useParams(), own=!username
 const {balance,points,creatorPoints,postMetrics,userPosts,publicPosts,savedPosts,followingUsernames,followingByAccount,toggleFollow}=useApp()
 const readOwnProfile=()=>{try{return JSON.parse(localStorage.getItem('socialstart-settings-profile')||'{}')}catch{return {}}}
 const readCloudProfiles=()=>{const found:Record<string,unknown>[]=[];for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(!key?.startsWith('socialstart-public-profile-'))continue;try{found.push(JSON.parse(localStorage.getItem(key)||'{}'))}catch{/* Ignore a damaged cached public profile. */}}return found}
 const [savedProfile,setSavedProfile]=useState<Record<string,string>>(readOwnProfile)
 useEffect(()=>{const update=()=>setSavedProfile(readOwnProfile());window.addEventListener('socialstart-profile-updated',update);return()=>window.removeEventListener('socialstart-profile-updated',update)},[])
 const foundProfile=profiles.find(item=>item.username===username)
 const cloudProfiles=readCloudProfiles()
 const usernameIdentity=publicPosts.find(item=>item.username===username)
 const cloudProfile=cloudProfiles.find(item=>item.username===username||item.uid===username||item.uid===usernameIdentity?.ownerAccountId) as {uid?:string;name?:string;username?:string;avatar?:string;bio?:string;location?:string;lastActiveAt?:number;stats?:{followers?:number;following?:number;likes?:number;views?:number}}|undefined
 const publicUserPosts=publicPosts.filter(item=>item.username===username||item.ownerAccountId===username||(cloudProfile?.uid&&item.ownerAccountId===cloudProfile.uid))
 const publicIdentity=publicUserPosts[0]
 const profile=own
  ? {name:savedProfile.name||'Alex Morgan',user:savedProfile.username||'alexmorgan',avatar:savedProfile.avatar||'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&auto=format&fit=crop',bio:savedProfile.bio||'Creative director, weekend wanderer, and believer in making the internet feel a little more human.',location:savedProfile.location||'Los Angeles, CA'}
  : cloudProfile?{name:cloudProfile.name||publicIdentity?.author||username||'SocialStart creator',user:cloudProfile.username||username||'',avatar:cloudProfile.avatar||publicIdentity?.avatar||'',bio:cloudProfile.bio||'Creating and sharing on SocialStart.',location:cloudProfile.location||publicIdentity?.location||''}
  : foundProfile?{name:foundProfile.name,user:foundProfile.username,avatar:foundProfile.avatar,bio:foundProfile.bio,location:foundProfile.location}:{name:publicIdentity?.author||username||'SocialStart creator',user:username||'',avatar:publicIdentity?.avatar||'',bio:'Creating and sharing on SocialStart.',location:publicIdentity?.location||''}
 const [tab,setTab]=useState('Posts'),[connectionModal,setConnectionModal]=useState<'Followers'|'Following'|null>(null)
 const followerProfiles=own?[]:profiles.filter(item=>item.username!==profile.user).slice(0,3)
 const followingProfiles=own?profiles.filter(item=>followingUsernames.includes(item.username)):profiles.filter(item=>item.username!==profile.user).slice(2,5)
 const trackedPosts=own?userPosts:publicUserPosts
 const totalLikes=trackedPosts.reduce((total,post)=>total+post.likes+(postMetrics[post.id]?.likes||0),0)
 const totalViews=trackedPosts.reduce((total,post)=>total+(Number(post.views)||0)+(postMetrics[post.id]?.views||0),0)
 const targetAccountId=own?localStorage.getItem('socialstart-active-account'):cloudProfile?.uid||publicIdentity?.ownerAccountId
 const followerCount=Object.values(followingByAccount).filter(following=>following.includes(profile.user)).length
 const followingCount=targetAccountId?(followingByAccount[targetAccountId]?.length||0):(own?followingUsernames.length:followingProfiles.length)
 const stats=own?[String(followerCount),String(followingCount),String(totalLikes),String(totalViews)]:cloudProfile?.stats?[String(cloudProfile.stats.followers||0),String(cloudProfile.stats.following||0),String(cloudProfile.stats.likes||0),String(cloudProfile.stats.views||0)]:publicIdentity?[String(followerCount),String(followingCount),String(totalLikes),String(totalViews)]:[String(followerProfiles.length),String(followingProfiles.length),'18.6K','94.2K']
 const formattedStats=stats.map(formatCount)
 const visiblePosts=tab==='Saved'?savedPosts:userPosts
 const livePost=!own?posts.find(post=>post.username===profile.user&&post.mediaType==='live'):undefined
 const isOnline=own?true:cloudProfile?Date.now()-(cloudProfile.lastActiveAt||0)<150000:profile.user.length%2===0
 const membership=membershipPlanFor(profile.user),hasMembership=Boolean(activeMembershipFor(profile.user))

 return <div className="profile-page">
  <section className="profile-hero"><Link to={`/profile/${profile.user}/story`} className={`avatar-ring ${isOnline?'online':'offline'}`} aria-label={`View ${profile.name}'s story`}><img src={profile.avatar}/><i title={isOnline?'Online':'Offline'}/></Link><div className="profile-main"><p className="eyebrow">{profile.user}</p><h1>{profile.name}</h1><p className="bio">{profile.bio}</p><p className="location"><MapPin/> {profile.location}</p><div className="profile-buttons">{own?<><Link to="/settings/profile" className="primary-btn">Edit profile</Link><Link to={`/store/${profile.user}/manage`} className="secondary-btn"><Store/> Online store</Link><Link to="/membership/setup" className="secondary-btn"><Crown/> {membership?'Edit subscription':'Create subscription'}</Link></>:<><button onClick={()=>toggleFollow(profile.user)} className="primary-btn">{followingUsernames.includes(profile.user)?'Following':'Follow'}</button><Link to={`/inbox/${profile.user}`} className="secondary-btn">Message</Link><Link to={`/store/${cloudProfile?.uid||profile.user}`} className="secondary-btn"><Store/> Online store</Link>{membership&&!hasMembership&&<Link className="membership-purchase" to={`/membership/${profile.user}/checkout`}><Crown/> Purchase Membership · ${membership.price.toFixed(2)}/month</Link>}{membership&&hasMembership&&<span className="membership-active"><Crown/> Member · renews monthly</span>}</>}</div></div></section>
  <section className="stat-strip"><button onClick={()=>setConnectionModal('Followers')}><b>{formattedStats[0]}</b><span>Followers</span></button><button onClick={()=>setConnectionModal('Following')}><b>{formattedStats[1]}</b><span>Following</span></button><div><b>{formattedStats[2]}</b><span>Total likes</span></div><div><b>{formattedStats[3]}</b><span>Views</span></div>{own&&<><div><b>{formatCount(points+(creatorPoints[profile.user]||0))}</b><span>Social points</span></div><div><b>{formatCurrency(balance)}</b><span>Balance</span></div></>}</section>
  {!own&&<div className="creator-point-total"><b>{formatCount(creatorPoints[profile.user]||0)}</b><span> Social Points received</span></div>}
  {livePost&&<section className="profile-live"><p className="eyebrow">STREAMING LIVE NOW</p><PostCard post={livePost}/></section>}
  {own&&<div className="profile-tabs hashtag-tabs"><Link to="/hashtags"><Hash/> Followed hashtags</Link><Link to="/hashtags/created"><Hash/> Created hashtags</Link></div>}
  <div className="profile-tabs"><button className={tab==='Posts'?'active':''} onClick={()=>setTab('Posts')}><Grid3X3/> Posts</button>{own&&<button className={tab==='Saved'?'active':''} onClick={()=>setTab('Saved')}><Bookmark/> Saved</button>}</div>
  {own?(visiblePosts.length===0?<div className="profile-empty"><Grid3X3/><h3>{tab==='Posts'?'No posts yet':'Nothing saved yet'}</h3><p>{tab==='Posts'?'When you share your first post, it will appear here.':'Posts you save will appear here.'}</p>{tab==='Posts'&&<Link to="/create" className="primary-btn">Create your first post</Link>}</div>:<div className="profile-post-feed">{visiblePosts.map(p=><PostCard post={p} ownerView={tab==='Posts'} profileView key={p.id}/>)}</div>):<div className="profile-post-feed">{[...publicUserPosts,...posts.filter(p=>p.username===profile.user&&p.mediaType!=='live')].map(p=><PostCard post={p} profileView key={p.id}/>)}</div>}
  {connectionModal&&<div className="connections-modal"><div><button className="modal-close" onClick={()=>setConnectionModal(null)}><X/></button><h2>{connectionModal}</h2>{(connectionModal==='Followers'?followerProfiles:followingProfiles).length?(connectionModal==='Followers'?followerProfiles:followingProfiles).map(person=><Link to={`/profile/${person.username}`} onClick={()=>setConnectionModal(null)} key={person.username}><img src={person.avatar}/><div><b>{person.name}</b><span>@{person.username}</span></div></Link>):<p className="empty-connections">No one here yet.</p>}</div></div>}
 </div>
}
