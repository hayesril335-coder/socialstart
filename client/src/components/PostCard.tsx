import { useState } from 'react'
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Post } from '../types'
export function PostCard({post}:{post:Post}){
 const [liked,setLiked]=useState(false),[saved,setSaved]=useState(!!post.saved),[following,setFollowing]=useState(post.following)
 return <article className="post-card">
  <div className="post-owner"><Link to={`/profile/${post.username}`}><img src={post.avatar}/></Link><div><Link to={`/profile/${post.username}`}><b>{post.author}</b></Link><span>{post.location} · {post.followers} followers</span></div><button className={following?'follow following':'follow'} onClick={()=>setFollowing(!following)}>{following?'Following':'Follow'}</button><button className="plain"><MoreHorizontal/></button></div>
  <Link to={`/post/${post.id}`} className="media-wrap"><img src={post.image} alt={post.title}/><span className="media-label">FEATURED</span></Link>
  <div className="post-actions"><div><button onClick={()=>setLiked(!liked)} className={liked?'liked':''}><Heart fill={liked?'currentColor':'none'}/></button><button><MessageCircle/></button><button><Send/></button></div><button onClick={()=>setSaved(!saved)}><Bookmark fill={saved?'currentColor':'none'}/></button></div>
  <div className="post-copy"><b>{(post.likes+(liked?1:0)).toLocaleString()} likes</b><p><strong>@{post.username}</strong> {post.title}</p><span>{post.views} views · View all 86 comments</span></div>
 </article>
}
