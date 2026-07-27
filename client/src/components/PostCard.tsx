import { useState } from 'react'
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Post } from '../types'

export function PostCard({post}:{post:Post}){
 const {isPostSaved,toggleSavedPost,likedPostIds,togglePostLike,followingUsernames,toggleFollow,recordShare}=useApp()
 const [shared,setShared]=useState(false)
 const liked=likedPostIds.includes(post.id),saved=isPostSaved(post.id),following=followingUsernames.includes(post.username)
 const share=async()=>{const url=`${window.location.origin}/post/${post.id}`;try{if(navigator.share)await navigator.share({title:post.title,text:`See ${post.author}'s post on SocialStart`,url});else await navigator.clipboard.writeText(url);recordShare();setShared(true);window.setTimeout(()=>setShared(false),2200)}catch{/* The user cancelled the native share sheet. */}}
 return <article className="post-card">
  <div className="post-owner"><Link to={`/profile/${post.username}`}><img src={post.avatar}/></Link><div><Link to={`/profile/${post.username}`}><b>{post.author}</b></Link><span>{post.location} · {post.followers} followers</span></div>{post.username!=='alexmorgan'&&<button className={following?'follow following':'follow'} onClick={()=>toggleFollow(post.username)}>{following?'Following':'Follow'}</button>}<button className="plain"><MoreHorizontal/></button></div>
  <Link to={`/post/${post.id}`} className="media-wrap">{post.mediaType==='video'?<video src={post.image} muted playsInline/>:<img src={post.image} alt={post.title}/>}<span className="media-label">{post.username==='alexmorgan'?'YOUR POST':'FEATURED'}</span></Link>
  <div className="post-actions"><div><button onClick={()=>togglePostLike(post.id)} className={liked?'liked':''} aria-label="Like post"><Heart fill={liked?'currentColor':'none'}/></button><Link className="post-action-link" to={`/post/${post.id}`} aria-label="Comment"><MessageCircle/></Link><button onClick={share} aria-label="Share post"><Send/></button></div><button onClick={()=>toggleSavedPost(post)} aria-label="Save post"><Bookmark fill={saved?'currentColor':'none'}/></button></div>
  {shared&&<div className="share-success">Post link copied — ready to share.</div>}
  <div className="post-copy"><b>{(post.likes+(liked?1:0)).toLocaleString()} likes</b><p><strong>@{post.username}</strong> {post.title}</p><span>{post.views} views · View comments</span></div>
 </article>
}
