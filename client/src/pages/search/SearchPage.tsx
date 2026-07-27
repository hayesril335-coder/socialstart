import { useMemo, useState } from 'react'
import { MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { PostCard } from '../../components/PostCard'
import { useApp } from '../../context/AppContext'
import { posts } from '../../utils/mockData'

type Coordinates={latitude:number;longitude:number}
const viewNumber=(value:string)=>{const number=parseFloat(value);return value.toUpperCase().includes('K')?number*1000:value.toUpperCase().includes('M')?number*1000000:number}
const distanceMiles=(from:Coordinates,latitude?:number,longitude?:number)=>{
 if(latitude===undefined||longitude===undefined)return Number.POSITIVE_INFINITY
 const radius=3958.8,toRadians=(degrees:number)=>degrees*Math.PI/180
 const latitudeDelta=toRadians(latitude-from.latitude),longitudeDelta=toRadians(longitude-from.longitude)
 const a=Math.sin(latitudeDelta/2)**2+Math.cos(toRadians(from.latitude))*Math.cos(toRadians(latitude))*Math.sin(longitudeDelta/2)**2
 return 2*radius*Math.asin(Math.sqrt(a))
}

export function SearchPage(){
 const {followingUsernames,userPosts}=useApp()
 const cachedLocation=()=>{try{return JSON.parse(localStorage.getItem('socialstart-location')||'null') as Coordinates|null}catch{return null}}
 const [feed,setFeed]=useState('Popular'),[query,setQuery]=useState(''),[coordinates,setCoordinates]=useState<Coordinates|null>(cachedLocation),[locationStatus,setLocationStatus]=useState('')
 const selectFeed=(next:string)=>{
  setFeed(next)
  if(next==='Nearby'&&!coordinates){
   if(!navigator.geolocation){setLocationStatus('Location is unavailable on this device.');return}
   setLocationStatus('Finding posts near you…')
   navigator.geolocation.getCurrentPosition(
    position=>{const next={latitude:position.coords.latitude,longitude:position.coords.longitude};setCoordinates(next);localStorage.setItem('socialstart-location',JSON.stringify(next));setLocationStatus('Sorted using your current location.')},
    ()=>setLocationStatus('Allow location access to sort posts nearest to you.'),
    {enableHighAccuracy:false,timeout:10000,maximumAge:300000}
   )
  }
 }
 const filtered=useMemo(()=>{
  const matching=[...userPosts,...posts].filter(post=>(post.title+post.author+post.username).toLowerCase().includes(query.toLowerCase()))
  if(feed==='Following')return matching.filter(post=>followingUsernames.includes(post.username))
  if(feed==='Nearby'&&coordinates)return matching.sort((a,b)=>distanceMiles(coordinates,a.approximateLatitude,a.approximateLongitude)-distanceMiles(coordinates,b.approximateLatitude,b.approximateLongitude))
  if(feed==='Popular')return matching.sort((a,b)=>viewNumber(b.views)-viewNumber(a.views))
  return matching
 },[coordinates,feed,followingUsernames,query,userPosts])
 return <div className="feed-page">
  <section className="feed-intro"><p className="eyebrow">DISCOVER YOUR WORLD</p><h1>What’s happening<br/><em>around you?</em></h1><div className="feed-tabs">{['Nearby','Popular','Following'].map(item=><button onClick={()=>selectFeed(item)} className={feed===item?'active':''} key={item}>{item==='Nearby'&&<MapPin/>}{item}</button>)}</div>{feed==='Nearby'&&locationStatus&&<p className="location-status">{locationStatus}</p>}<label className="search-box"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search creators, stories, or ideas"/><SlidersHorizontal/></label></section>
  <div className="feed-heading"><div><p className="eyebrow">{feed.toUpperCase()} FEED</p><h2>{feed==='Following'?'People you follow':feed==='Nearby'?'Closest to you':'Most viewed'}</h2></div><span>{feed==='Popular'?'Ranked by total views':feed==='Nearby'?'Your exact location stays private':'Your personalized feed'}</span></div>
  {filtered.length?<div className="feed-grid">{filtered.map(post=><PostCard post={post} key={post.id}/>)}</div>:<div className="feed-empty"><h3>{feed==='Following'?'You aren’t following anyone yet':'No posts found'}</h3><p>{feed==='Following'?'Follow a creator from Popular or Nearby and their posts will appear here.':'Try another search.'}</p></div>}
 </div>
}
