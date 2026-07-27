import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PostCard } from '../../components/PostCard'
import { useApp } from '../../context/AppContext'
import { posts } from '../../utils/mockData'
export function PostDetailsPage(){const {postId}=useParams(),{userPosts,viewPost}=useApp();const post=[...userPosts,...posts].find(p=>p.id===postId)||posts[0];useEffect(()=>{if(postId)viewPost(postId)},[postId]);return <div className="narrow-page"><p className="eyebrow">POST BY @{post.username}</p><PostCard post={post}/><section className="comments"><h3>Conversation</h3>{post.username==='alexmorgan'?<div className="empty">No comments yet.</div>:<div><img src={posts[2].avatar}/><p><b>Amara Jones</b> This feels like a whole mood. The light is perfect!</p></div>}<form onSubmit={e=>e.preventDefault()}><input placeholder="Add to the conversation…"/><button>Post</button></form></section></div>}
