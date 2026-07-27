import { useState } from 'react'
import { Bookmark, Heart, Maximize, MessageCircle, MoreHorizontal, Send, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Post } from '../types'
export function PostCard({post}:{post:Post}){
 const {isPostSaved,toggleSavedPost,likedPostIds,togglePostLike,followingUsernames,toggleFollow,recordShare}=useApp()
 const [shared,setShared]=useState(false),[fullscreen,setFullscreen]=useState(false)
 const liked=likedPostIds.includes(post.id),saved=isPostSaved(post.id),following=followingUsernames.includes(post.username)
 const share=async()=>{const url=`${window.location.origin}/post/${post.id}`;try{if(navigator.share)await navigator.share({title:post.title,text:`See ${post.author}'s post on SocialStart`,url});else await navigator.clipboard.writeText(url);recordShare();setShared(true);window.setTimeout(()=>setShared(false),2200)}catch{/* User cancelled sharing. */}}
 const media=post.mediaType==='video'?<video src={post.image} controls={fullscreen} autoPlay={fullscreen} muted playsInline/>:<img src={post.image} alt={post.title}/>
 return <article className="post-card"><div className="post-owner"><Link to={`/profile/${post.username}`}><img src={post.avatar}/></Link><div><Link to={`/profile/${post.username}`}><b>{post.author}</b></Link><span>{post.location} · {post.followers} followers</span></div>{post.username!=='alexmorgan'&&<button className={following?'follow following':'follow'} onClick={()=>toggleFollow(post.username)}>{following?'Following':'Follow'}</button>}<button className="plain"><MoreHorizontal/></button></div>
  <div className="media-wrap"><Link to={`/post/${post.id}`} className="media-content">{media}<span className={post.mediaType==='live'?'media-label live-label':'media-label'}>{post.mediaType==='live'?'● LIVE':post.username==='alexmorgan'?'YOUR POST':'FEATURED'}</span>{post.mediaType==='live'&&<span className="live-viewers">{post.views} watching</span>}</Link><button className="post-fullscreen" onClick={()=>setFullscreen(true)} aria-label="View post fullscreen"><Maximize/></button></div>
  <div className="post-actions"><div><button onClick={()=>togglePostLike(post.id)} className={liked?'liked':''}><Heart fill={liked?'currentColor':'none'}/></button><Link className="post-action-link" to={`/post/${post.id}`}><MessageCircle/></Link><button onClick={share}><Send/></button></div><button onClick={()=>toggleSavedPost(post)}><Bookmark fill={saved?'currentColor':'none'}/></button></div>{shared&&<div className="share-success">Post link copied — ready to share.</div>}<div className="post-copy"><b>{(post.likes+(liked?1:0)).toLocaleString()} likes</b><p><strong>@{post.username}</strong> {post.title}</p><span>{post.views} views · View comments</span></div>
  {fullscreen&&<div className="fullscreen-overlay"><button onClick={()=>setFullscreen(false)} aria-label="Exit fullscreen"><X/></button>{media}<div><b>@{post.username}</b><span>{post.title}</span></div></div>}
 </article>
}
