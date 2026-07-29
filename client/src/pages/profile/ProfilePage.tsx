import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bookmark, Crown, Grid3X3, Hash, MapPin, Store, X } from 'lucide-react'
import { posts, profiles } from '../../utils/mockData'
import { useApp } from '../../context/AppContext'
import { PostCard } from '../../components/PostCard'
import { activeMembershipFor, membershipPlanFor } from '../../lib/memberships'
import { formatCount, formatCurrency, parseCount } from '../../lib/format'

const cityCoordinates:Record<string,[number,number]>={
 'los angeles':[34.0522,-118.2437],'silver lake':[34.0869,-118.2702],'malibu':[34.0259,-118.7798],'echo park':[34.0782,-118.2606],'santa monica':[34.0195,-118.4912],'downtown la':[34.0407,-118.2468],'highland park':[34.1158,-118.1854],'topanga':[34.0917,-118.6021],'culver city':[34.0211,-118.3965],'portland':[45.5152,-122.6784]
}
const hashValue=(value:string)=>[...value].reduce((total,character)=>((total*31)+character.charCodeAt(0))>>>0,7)
const mapPosition=(location:string,username:string)=>{
 const normalized=location.toLowerCase(),match=Object.entries(cityCoordinates).find(([city])=>normalized.includes(city)),hash=hashValue(username)
 const [latitude,longitude]=match?.[1]||[32+(hash%1500)/100, -124+(hash%5400)/100]
 const jitterX=((hash%9)-4)*.7,jitterY=(((Math.floor(hash/9))%9)-4)*.7
 return {left:`${Math.max(5,Math.min(95,((longitude+125)/59)*100+jitterX))}%`,top:`${Math.max(10,Math.min(90,((50-latitude)/25)*100+jitterY))}%`}
}

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
 const cloudProfile=cloudProfiles.find(item=>item.username===username||item.uid===username||item.uid===usernameIdentity?.ownerAccountId) as {uid?:string;name?:string;username?:string;avatar?:string;bio?:string;location?:string;lastActiveAt?:number;stats?:{followers?:number;following?:number;likes?:number;views?:number;socialPoints?:number}}|undefined
 const publicUserPosts=publicPosts.filter(item=>item.username===username||item.ownerAccountId===username||(cloudProfile?.uid&&item.ownerAccountId===cloudProfile.uid))
 const publicIdentity=publicUserPosts[0]
 const profile=own
  ? {name:savedProfile.name||'Alex Morgan',user:savedProfile.username||'alexmorgan',avatar:savedProfile.avatar||'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&auto=format&fit=crop',bio:(savedProfile.bio||'Creative director, weekend wanderer, and believer in making the internet feel human.').slice(0,80),location:savedProfile.location||'Los Angeles, CA'}
  : cloudProfile?{name:cloudProfile.name||publicIdentity?.author||username||'SocialStart creator',user:cloudProfile.username||username||'',avatar:cloudProfile.avatar||publicIdentity?.avatar||'',bio:(cloudProfile.bio||'Creating and sharing on SocialStart.').slice(0,80),location:cloudProfile.location||publicIdentity?.location||''}
  : foundProfile?{name:foundProfile.name,user:foundProfile.username,avatar:foundProfile.avatar,bio:foundProfile.bio,location:foundProfile.location}:{name:publicIdentity?.author||username||'SocialStart creator',user:username||'',avatar:publicIdentity?.avatar||'',bio:'Creating and sharing on SocialStart.',location:publicIdentity?.location||''}
 const [tab,setTab]=useState('Posts'),[connectionModal,setConnectionModal]=useState<'Followers'|'Following'|null>(null)
 const followerProfiles=own?[]:profiles.filter(item=>item.username!==profile.user).slice(0,3)
 const followingProfiles=own?profiles.filter(item=>followingUsernames.includes(item.username)):profiles.filter(item=>item.username!==profile.user).slice(2,5)
 const trackedPosts=(own?userPosts:publicUserPosts).filter(post=>post.postType!=='story')
 const totalLikes=trackedPosts.reduce((total,post)=>total+post.likes+(postMetrics[post.id]?.likes||0),0)
 const totalViews=trackedPosts.reduce((total,post)=>total+parseCount(post.views)+(postMetrics[post.id]?.views||0),0)
 const targetAccountId=own?localStorage.getItem('socialstart-active-account'):cloudProfile?.uid||publicIdentity?.ownerAccountId
 const followerCount=Object.values(followingByAccount).filter(following=>following.includes(profile.user)).length
 const followingCount=targetAccountId?(followingByAccount[targetAccountId]?.length||0):(own?followingUsernames.length:followingProfiles.length)
 const stats=own?[String(followerCount),String(followingCount),String(totalLikes),String(totalViews)]:cloudProfile?.stats?[String(cloudProfile.stats.followers||0),String(cloudProfile.stats.following||0),String(cloudProfile.stats.likes||0),String(cloudProfile.stats.views||0)]:publicIdentity?[String(followerCount),String(followingCount),String(totalLikes),String(totalViews)]:[String(followerProfiles.length),String(followingProfiles.length),'18.6K','94.2K']
 const formattedStats=stats.map(formatCount)
 const visiblePosts=(tab==='Saved'?savedPosts:userPosts).filter(post=>post.postType!=='story')
 const livePost=!own?posts.find(post=>post.username===profile.user&&post.mediaType==='live'):undefined
 const isOnline=own?true:cloudProfile?Date.now()-(cloudProfile.lastActiveAt||0)<150000:profile.user.length%2===0
 const membership=membershipPlanFor(profile.user),hasMembership=Boolean(activeMembershipFor(profile.user))
 const mapFollowing=own?followingUsernames:(targetAccountId?followingByAccount[targetAccountId]||[]:[])
 const mapPeople=mapFollowing.map(followedUsername=>{
  const mock=profiles.find(item=>item.username===followedUsername),cloud=cloudProfiles.find(item=>item.username===followedUsername) as {name?:string;username?:string;avatar?:string;location?:string;stats?:{socialPoints?:number}}|undefined,post=publicPosts.find(item=>item.username===followedUsername),name=cloud?.name||mock?.name||post?.author||followedUsername,avatar=cloud?.avatar||mock?.avatar||post?.avatar||'',location=cloud?.location||mock?.location||post?.location||'Los Angeles, CA',socialPoints=cloud?.stats?.socialPoints??creatorPoints[followedUsername]??(100+hashValue(followedUsername)%900)
  return {username:followedUsername,name,avatar,location,socialPoints,position:mapPosition(location,followedUsername)}
 })
 const profileSocialPoints=own?points:(cloudProfile?.stats?.socialPoints??creatorPoints[profile.user]??(foundProfile?100+hashValue(profile.user)%900:0))

 return <div className="profile-page">
  <section className="profile-hero"><div className="profile-identity"><Link to={`/profile/${profile.user}/story`} className={`avatar-ring ${isOnline?'online':'offline'}`} aria-label={`View ${profile.name}'s story`}><img src={profile.avatar}/><i title={isOnline?'Online':'Offline'}/></Link><p className="profile-username">{profile.user}</p></div><div className="profile-main"><h1>{profile.name}</h1><p className="bio">{profile.bio}</p><p className="location"><MapPin/> {profile.location}</p>{!own&&<div className="profile-buttons"><button onClick={()=>toggleFollow(profile.user)} className="primary-btn">{followingUsernames.includes(profile.user)?'Following':'Follow'}</button><Link to={`/inbox/${profile.user}`} className="secondary-btn">Message</Link><Link to={`/store/${cloudProfile?.uid||profile.user}`} className="secondary-btn"><Store/> Online store</Link>{membership&&!hasMembership&&<Link className="membership-purchase" to={`/membership/${profile.user}/checkout`}><Crown/> Purchase Membership · ${membership.price.toFixed(2)}/month</Link>}{membership&&hasMembership&&<span className="membership-active"><Crown/> Member · renews monthly</span>}</div>}</div></section>
  <section className="social-point-summary"><span>SOCIAL POINTS</span><b>{formatCount(profileSocialPoints)}</b><small>Earn points from views, likes, follows, saves, and activity.</small></section>
  <section className="profile-map-card"><header><div><p className="eyebrow">FOLLOWING MAP</p><h2>Where your community is</h2></div><MapPin/></header><div className="community-map"><svg viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true"><path d="M87 90 186 49 305 69 386 45 476 82 559 72 647 99 760 93 879 137 932 205 900 278 844 313 821 388 749 408 692 374 626 397 558 371 493 394 426 359 354 378 289 339 230 352 184 307 124 284 98 220 60 169Z"/><path d="M138 147 287 151 421 135 564 153 713 143 861 180M112 229 263 233 413 218 572 236 742 222 897 248M184 307 335 296 493 315 649 297 821 316"/></svg>{mapPeople.length?mapPeople.map(person=><Link to={`/profile/${person.username}`} className="map-person" style={person.position} key={person.username} aria-label={`${person.name} in ${person.location} with ${person.socialPoints} social points`}><b>{formatCount(person.socialPoints)} pts</b>{person.avatar?<img src={person.avatar} alt=""/>:<span>{person.name.slice(0,1)}</span>}<small>{person.location.split(',')[0]}</small></Link>):<div className="map-empty"><MapPin/><b>Your following map is ready</b><span>Follow people to see their profile pictures in their selected cities.</span></div>}</div></section>
  <section className="stat-strip"><button onClick={()=>setConnectionModal('Followers')}><b>{formattedStats[0]}</b><span>Followers</span></button><button onClick={()=>setConnectionModal('Following')}><b>{formattedStats[1]}</b><span>Following</span></button><div><b>{formattedStats[2]}</b><span>Total likes</span></div><div><b>{formattedStats[3]}</b><span>Total views</span></div>{own&&<div><b>{formatCurrency(balance)}</b><span>Balance</span></div>}</section>
  {livePost&&<section className="profile-live"><p className="eyebrow">STREAMING LIVE NOW</p><PostCard post={livePost}/></section>}
  {own&&<div className="profile-tabs hashtag-tabs"><Link to="/hashtags"><Hash/> Followed hashtags</Link><Link to="/hashtags/created"><Hash/> Created hashtags</Link></div>}
  <div className="profile-tabs"><button className={tab==='Posts'?'active':''} onClick={()=>setTab('Posts')}><Grid3X3/> Posts</button>{own&&<button className={tab==='Saved'?'active':''} onClick={()=>setTab('Saved')}><Bookmark/> Saved</button>}</div>
  {own?(visiblePosts.length===0?<div className="profile-empty"><Grid3X3/><h3>{tab==='Posts'?'No posts yet':'Nothing saved yet'}</h3><p>{tab==='Posts'?'When you share your first post, it will appear here.':'Posts you save will appear here.'}</p>{tab==='Posts'&&<Link to="/create" className="primary-btn">Create your first post</Link>}</div>:<div className="profile-post-feed">{visiblePosts.map(p=><PostCard post={p} ownerView={tab==='Posts'} profileView key={p.id}/>)}</div>):<div className="profile-post-feed">{[...publicUserPosts.filter(post=>post.postType!=='story'),...posts.filter(p=>p.username===profile.user&&p.mediaType!=='live')].map(p=><PostCard post={p} profileView key={p.id}/>)}</div>}
  {connectionModal&&<div className="connections-modal"><div><button className="modal-close" onClick={()=>setConnectionModal(null)}><X/></button><h2>{connectionModal}</h2>{(connectionModal==='Followers'?followerProfiles:followingProfiles).length?(connectionModal==='Followers'?followerProfiles:followingProfiles).map(person=><Link to={`/profile/${person.username}`} onClick={()=>setConnectionModal(null)} key={person.username}><img src={person.avatar}/><div><b>{person.name}</b><span>@{person.username}</span></div></Link>):<p className="empty-connections">No one here yet.</p>}</div></div>}
 </div>
}
