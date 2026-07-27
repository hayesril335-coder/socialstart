import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { posts, profiles, stories } from '../../utils/mockData'
import { useApp } from '../../context/AppContext'
export function StoryPage(){
 const {username}=useParams(),navigate=useNavigate(),{followingUsernames,publicPosts}=useApp(),profile=profiles.find(item=>item.username===username),story=stories.find(item=>item.username===username),publicStory=publicPosts.find(item=>item.username===username)||posts.find(item=>item.username===username&&item.mediaType!=='live'),identity=profile||{name:publicStory?.author||username||'Creator',username:username||'',avatar:publicStory?.avatar||''},media=story?.image||publicStory?.image||'',caption=story?.caption||publicStory?.title||'Shared on SocialStart.'
 const nextStory=()=>{const current=followingUsernames.indexOf(username||''),next=followingUsernames[current+1];navigate(next?`/profile/${next}/story`:'/search',{replace:true})}
 useEffect(()=>{const timer=window.setTimeout(nextStory,5000);return()=>window.clearTimeout(timer)},[username,followingUsernames])
 return <div className="story-viewer"><button onClick={()=>navigate('/search')} aria-label="Close story"><X/></button><div className="story-progress"><i/></div><header><img src={identity.avatar}/><div><b>{identity.name}</b><span>@{identity.username} · Story</span></div></header>{publicStory?.mediaType==='video'?<video className="story-media" src={media} autoPlay playsInline onEnded={nextStory}/>:<img className="story-media" src={media}/>}<p>{caption}</p></div>
}
