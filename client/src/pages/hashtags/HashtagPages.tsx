import { useEffect, useState } from 'react'
import { Hash, Plus, Trash2, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { PostCard } from '../../components/PostCard'
import { useApp } from '../../context/AppContext'
import { createHashtag, extractHashtags, followedHashtags, followHashtag, hashtagRanks, hashtagRegistry, ownedHashtags, rankBoostHours, rankFor, rankPriority, setHashtagRank, unfollowHashtag, type HashtagRank } from '../../lib/hashtags'
import { posts } from '../../utils/mockData'

const ownUsername=()=>{try{return JSON.parse(localStorage.getItem('socialstart-settings-profile')||'{}').username||'alexmorgan'}catch{return 'alexmorgan'}}

export function FollowedHashtagsPage(){
 const [tags,setTags]=useState(followedHashtags),[draft,setDraft]=useState(''),username=ownUsername()
 useEffect(()=>{const update=()=>setTags(followedHashtags());window.addEventListener('socialstart-hashtags-updated',update);return()=>window.removeEventListener('socialstart-hashtags-updated',update)},[])
 const add=()=>{const tag=followHashtag(draft,username);if(tag){setTags(followedHashtags());setDraft('')}}
 return <div className="form-page hashtag-list-page"><p className="eyebrow">YOUR COMMUNITY</p><h1>Followed Hashtags</h1><div className="hashtag-add"><input value={draft} onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')add()}} placeholder="#AddHashtag"/><button className="primary-btn" onClick={add} disabled={!draft.trim()}><Plus/> Add hashtag</button></div>{tags.length?<div className="hashtag-list">{tags.map(tag=><div key={tag}><Link to={`/hashtag/${tag}`}><Hash/><span><b>#{tag}</b><small>{rankFor(tag,username)||'Member'}</small></span></Link><button onClick={()=>unfollowHashtag(tag)} aria-label={`Unfollow ${tag}`}><Trash2/></button></div>)}</div>:<div className="profile-empty"><Hash/><h3>No followed hashtags</h3><p>Add a hashtag above to follow its posts and become a member.</p></div>}</div>
}

export function CreatedHashtagsPage(){
 const username=ownUsername(),[created,setCreated]=useState(()=>ownedHashtags(username)),[draft,setDraft]=useState('')
 useEffect(()=>{const update=()=>setCreated(ownedHashtags(username));window.addEventListener('socialstart-hashtags-updated',update);return()=>window.removeEventListener('socialstart-hashtags-updated',update)},[username])
 const add=()=>{if(createHashtag(draft,username)){setCreated(ownedHashtags(username));setDraft('')}}
 return <div className="form-page hashtag-list-page"><p className="eyebrow">HASHTAGS YOU FOUNDED · {created.length}/10</p><h1>Created Hashtags</h1><div className="hashtag-add"><input value={draft} onChange={event=>setDraft(event.target.value)} placeholder="#CreateHashtag"/><button className="primary-btn" disabled={!draft.trim()||created.length>=10} onClick={add}><Plus/> Create hashtag</button></div>{created.length?<div className="hashtag-list">{created.map(record=><div key={record.tag}><Link to={`/hashtag/${record.tag}`}><Hash/><span><b>#{record.tag}</b><small>Founder · Manage ranks</small></span></Link></div>)}</div>:<div className="profile-empty"><Users/><h3>No created hashtags yet</h3><p>Create a hashtag above or be the first person to use one in a post.</p></div>}</div>
}

export function HashtagPage(){
 const {tag=''}=useParams(),username=ownUsername(),{userPosts,publicPosts}=useApp(),[registry,setRegistry]=useState(hashtagRegistry)
 useEffect(()=>{const update=()=>setRegistry(hashtagRegistry());window.addEventListener('socialstart-hashtags-updated',update);return()=>window.removeEventListener('socialstart-hashtags-updated',update)},[])
 const record=registry[tag.toLowerCase()],rank=record?.ranks[username]||(followedHashtags().includes(tag.toLowerCase())?'Member':undefined),isFounder=record?.founder===username
 const all=[...userPosts,...publicPosts,...posts].filter((post,index,array)=>array.findIndex(item=>item.id===post.id)===index&&[...(post.hashtags||[]),...extractHashtags(post.title)].includes(tag.toLowerCase()))
 const ordered=[...all].sort((a,b)=>{const rankA=record?.ranks[a.username]||'Member',rankB=record?.ranks[b.username]||'Member',priority=rankPriority[rankA]-rankPriority[rankB];if(priority)return priority;const intervalA=rankBoostHours[rankA],intervalB=rankBoostHours[rankB],timeA=Number(a.id.replace(/\D/g,''))||0,timeB=Number(b.id.replace(/\D/g,''))||0;return (timeB/intervalB)-(timeA/intervalA)})
 return <div className="hashtag-page"><header><p className="eyebrow">HASHTAG</p><h1>#{tag}</h1><div className="hashtag-rank-card"><span>Your rank</span><b>{rank||'Not a member'}</b>{!followedHashtags().includes(tag.toLowerCase())&&<button className="primary-btn" onClick={()=>followHashtag(tag,username)}>Follow hashtag</button>}</div></header>{ordered.length?<div className="feed-grid hashtag-posts">{ordered.map(post=><div key={post.id}><PostCard post={post}/>{isFounder&&post.username!==username&&<label className="assign-rank">Assign rank<select value={record?.ranks[post.username]||'Member'} onChange={event=>setHashtagRank(tag,post.username,event.target.value as HashtagRank)}>{hashtagRanks.filter(item=>item!=='Founder').map(item=><option key={item}>{item}</option>)}</select></label>}</div>)}</div>:<div className="profile-empty"><Hash/><h3>No posts yet</h3><p>Use #{tag} in a post title to add the first post.</p></div>}</div>
}
