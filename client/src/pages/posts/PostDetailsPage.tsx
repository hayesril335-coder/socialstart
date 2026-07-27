import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PostCard } from '../../components/PostCard'
import { useApp } from '../../context/AppContext'
import { posts } from '../../utils/mockData'
export function PostDetailsPage(){
 const {postId,username}=useParams(),{userPosts,viewPost}=useApp(),post=[...userPosts,...posts].find(p=>postId?p.id===postId:p.username===username&&p.mediaType!=='live')||posts[0],commentKey=`socialstart-comments-${post.id}`
 const [comments,setComments]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem(commentKey)||'[]')}catch{return []}}),[text,setText]=useState('')
 useEffect(()=>{if(postId)viewPost(postId)},[postId])
 useEffect(()=>{localStorage.setItem(commentKey,JSON.stringify(comments))},[commentKey,comments])
 const submit=()=>{const comment=text.trim();if(!comment)return;setComments(current=>[...current,comment]);setText('')}
 return <div className="narrow-page"><p className="eyebrow">{username?'STORY':'POST'} BY @{post.username}</p><PostCard post={post} ownerView={post.username==='alexmorgan'}/><section className="comments"><h3>Conversation</h3>{post.username!=='alexmorgan'&&<div><img src={posts[2].avatar}/><p><b>Amara Jones</b> This feels like a whole mood. The light is perfect!</p></div>}{comments.map((comment,index)=><div key={index}><img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=100&auto=format&fit=crop"/><p><b>You</b> {comment}</p></div>)}{post.username==='alexmorgan'&&comments.length===0&&<div className="empty">No comments yet.</div>}<form onSubmit={event=>{event.preventDefault();submit()}}><input value={text} onChange={event=>setText(event.target.value)} placeholder="Add to the conversation…"/><button type="submit">Post</button></form></section></div>
}
