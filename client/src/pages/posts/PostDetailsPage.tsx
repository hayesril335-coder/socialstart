import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PostCard } from '../../components/PostCard'
import { useApp } from '../../context/AppContext'
import { posts } from '../../utils/mockData'
export function PostDetailsPage(){
 const {postId,username}=useParams(),{userPosts,publicPosts}=useApp(),post=[...userPosts,...publicPosts,...posts].find(p=>postId?p.id===postId:p.username===username&&p.mediaType!=='live'),commentKey=`socialstart-comments-${post?.id||'missing'}`
 const [comments,setComments]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem(commentKey)||'[]')}catch{return []}}),[text,setText]=useState('')
 const readAvatar=()=>{try{return JSON.parse(localStorage.getItem('socialstart-settings-profile')||'{}').avatar||'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=100&auto=format&fit=crop'}catch{return 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=100&auto=format&fit=crop'}}
 const [commentAvatar,setCommentAvatar]=useState(readAvatar)
 useEffect(()=>{localStorage.setItem(commentKey,JSON.stringify(comments))},[commentKey,comments])
 useEffect(()=>{const update=()=>setCommentAvatar(readAvatar());window.addEventListener('socialstart-profile-updated',update);return()=>window.removeEventListener('socialstart-profile-updated',update)},[])
 const submit=()=>{const comment=text.trim();if(!comment)return;setComments(current=>[...current,comment]);setText('')}
 if(!post)return <div className="narrow-page"><div className="profile-empty"><h3>Post not found</h3><p>This post may no longer be available.</p></div></div>
 const own=post.ownerAccountId===localStorage.getItem('socialstart-active-account')
 return <div className="narrow-page"><p className="eyebrow">{username?'STORY':'POST'} BY @{post.username}</p><PostCard post={post} ownerView={own}/><section className="comments"><h3>Conversation</h3>{!own&&<div><img src={posts[2].avatar}/><p><b>Amara Jones</b> This feels like a whole mood. The light is perfect!</p></div>}{comments.map((comment,index)=><div key={index}><img src={commentAvatar}/><p><b>You</b> {comment}</p></div>)}{own&&comments.length===0&&<div className="empty">No comments yet.</div>}<form onSubmit={event=>{event.preventDefault();submit()}}><input value={text} onChange={event=>setText(event.target.value)} placeholder="Add to the conversation…"/><button type="submit">Post</button></form></section></div>
}
