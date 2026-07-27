import { useMemo, useState } from 'react'
import { MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { PostCard } from '../../components/PostCard'
import { posts } from '../../utils/mockData'
export function SearchPage(){
 const [feed,setFeed]=useState('Popular'),[query,setQuery]=useState('')
 const filtered=useMemo(()=>posts.filter(p=>(p.title+p.author+p.username).toLowerCase().includes(query.toLowerCase())),[query])
 return <div className="feed-page">
  <section className="feed-intro"><p className="eyebrow">DISCOVER YOUR WORLD</p><h1>What’s happening<br/><em>around you?</em></h1><div className="feed-tabs">{['Nearby','Popular','Following'].map(x=><button onClick={()=>setFeed(x)} className={feed===x?'active':''} key={x}>{x==='Nearby'&&<MapPin/>}{x}</button>)}</div><label className="search-box"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search creators, stories, or ideas"/><SlidersHorizontal/></label></section>
  <div className="feed-heading"><div><p className="eyebrow">{feed.toUpperCase()} FEED</p><h2>For you</h2></div><span>Fresh picks, updated daily</span></div>
  <div className="feed-grid">{filtered.map(p=><PostCard post={p} key={p.id}/>)}</div>
 </div>
}
