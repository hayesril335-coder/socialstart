import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Post } from '../types'
import { scheduleCloudSave } from '../lib/cloudSync'
import { registerPostHashtags } from '../lib/hashtags'

export type CartItem = { id:string; title:string; price:number; image:string; quantity:number; ship?:boolean; inPerson?:boolean; sellerUsername?:string }
export type PostMetric = { likes:number; views:number }
type AppState = {
  dark:boolean; setDark:(v:boolean)=>void; unread:number; unreadByConversation:Record<string,number>; markConversationRead:(id:string)=>void; points:number; pointsUsed:number; earnPoint:()=>void; viewPoints:{image:number;video:number}; giftViewPoints:(username:string,type:'image'|'video',amount:number)=>boolean; creatorPoints:Record<string,number>; donatePoints:(username:string,amount:number)=>boolean; balance:number; addFunds:(amount:number)=>void; spendBalance:(amount:number)=>boolean; postMetrics:Record<string,PostMetric>;
  cart:CartItem[]; addToCart:(item:Omit<CartItem,'quantity'>,quantity?:number)=>void; updateCartQuantity:(id:string,quantity:number)=>void; clearCart:()=>void;
  userPosts:Post[]; publicPosts:Post[]; addUserPost:(post:{title:string;image:string;mediaType?:'image'|'video';category?:string;hashtags?:string[];mediaFilter?:string;overlayText?:string;overlayX?:number;overlayY?:number;trimStart?:number;trimEnd?:number})=>void; deletePost:(id:string)=>void;
  savedPosts:Post[]; toggleSavedPost:(post:Post)=>void; isPostSaved:(id:string)=>boolean;
  likedPostIds:string[]; togglePostLike:(id:string)=>void; followingUsernames:string[]; followingByAccount:Record<string,string[]>; toggleFollow:(username:string)=>void;
  viewPost:(id:string)=>void; shareCount:number; recordShare:()=>void;
  lockedPosts:Record<string,number>; setPostPrice:(id:string,price:number)=>void; unlockPost:(id:string)=>void; purchasedPostIds:string[]; purchasePost:(id:string)=>void;
}

const Context = createContext<AppState | null>(null)
const read=<T,>(key:string,fallback:T):T=>{try{return JSON.parse(localStorage.getItem(key)||'') as T}catch{return fallback}}
const persist=(key:string,value:unknown)=>{try{localStorage.setItem(key,JSON.stringify(value));scheduleCloudSave()}catch{/* Large video blobs remain available for this session. */}}
type FollowerAlert={id:string;targetUsername:string;followerUsername:string;name:string;avatar:string;createdAt:number}
const followerAlerts=()=>read<FollowerAlert[]>('socialstart-global-follower-alerts',[])
const pendingFollowerAlerts=()=>{
 const profile=read<{username?:string}>('socialstart-settings-profile',{}),counted=read<string[]>('socialstart-counted-follower-alerts',[])
 const fresh=followerAlerts().filter(alert=>alert.targetUsername===profile.username&&!counted.includes(alert.id))
 if(fresh.length)localStorage.setItem('socialstart-counted-follower-alerts',JSON.stringify([...counted,...fresh.map(alert=>alert.id)]))
 return fresh
}
const readPublicPosts=()=>{
 const combined=read<Post[]>('socialstart-public-posts',[])
 for(let index=0;index<localStorage.length;index++){
  const key=localStorage.key(index)
  if(!key?.startsWith('socialstart-account-data-'))continue
  try{
   const accountId=key.slice('socialstart-account-data-'.length),snapshot=JSON.parse(localStorage.getItem(key)||'{}') as Record<string,string>
   const accountPosts=JSON.parse(snapshot['socialstart-user-posts']||'[]') as Post[]
   accountPosts.forEach(post=>{
    const found=combined.findIndex(item=>item.id===post.id)
    if(found>=0&&!combined[found].ownerAccountId)combined[found]={...combined[found],ownerAccountId:post.ownerAccountId||accountId}
    else if(found<0)combined.push({...post,ownerAccountId:post.ownerAccountId||accountId})
   })
  }catch{/* Ignore an invalid saved account snapshot. */}
 }
 return combined
}

export function AppProvider({children}:{children:ReactNode}) {
  const [dark,setDarkState] = useState(() => localStorage.getItem('socialstart-theme') === 'dark')
  const [cart,setCart] = useState<CartItem[]>(()=>read('socialstart-cart',[]))
  const [userPosts,setUserPosts]=useState<Post[]>(()=>read('socialstart-user-posts',[]))
  const [publicPosts,setPublicPosts]=useState<Post[]>(readPublicPosts)
  const [savedPosts,setSavedPosts]=useState<Post[]>(()=>read('socialstart-saved-posts',[]))
  const [likedPostIds,setLikedPostIds]=useState<string[]>(()=>read('socialstart-liked-posts',[]))
  const [viewedPostIds,setViewedPostIds]=useState<string[]>(()=>read('socialstart-viewed-posts',[]))
  const [postMetrics,setPostMetrics]=useState<Record<string,PostMetric>>(()=>read('socialstart-post-metrics',{}))
  const [followingUsernames,setFollowingUsernames]=useState<string[]>(()=>read('socialstart-following',[]))
  const [followingByAccount,setFollowingByAccount]=useState<Record<string,string[]>>(()=>read('socialstart-global-follow-graph',{}))
  const [shareCount,setShareCount]=useState(()=>read('socialstart-shares',0))
  const [points,setPoints]=useState(()=>read('socialstart-points',0))
  const [creatorPoints,setCreatorPoints]=useState<Record<string,number>>(()=>read('socialstart-global-creator-points',{}))
  const [lockedPosts,setLockedPosts]=useState<Record<string,number>>(()=>read('socialstart-locked-posts',{}))
  const [purchasedPostIds,setPurchasedPostIds]=useState<string[]>(()=>read('socialstart-purchased-posts',[]))
  const [pointsUsed,setPointsUsed]=useState(()=>read('socialstart-points-used',0))
  const [balance,setBalance]=useState(()=>read('socialstart-balance',0))
  const [unreadByConversation,setUnreadByConversation]=useState<Record<string,number>>(()=>{const saved=read<Record<string,number>>('socialstart-unread-messages',{}),pending=pendingFollowerAlerts().length;return pending?{...saved,welcome:(saved.welcome||0)+pending}:saved})
  const accountId=()=>localStorage.getItem('socialstart-active-account')||'guest'
  const readViewPoints=()=>{const all=read<Record<string,{image:number;video:number}>>('socialstart-view-points-by-account',{});return all[accountId()]||{image:0,video:0}}
  const [viewPoints,setViewPoints]=useState(readViewPoints)
  const setDark=(value:boolean)=>{setDarkState(value);localStorage.setItem('socialstart-theme',value?'dark':'light');scheduleCloudSave()}
  useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light'},[dark])
  useEffect(()=>persist('socialstart-cart',cart),[cart])
  useEffect(()=>persist('socialstart-user-posts',userPosts),[userPosts])
  useEffect(()=>persist('socialstart-public-posts',publicPosts),[publicPosts])
  useEffect(()=>{
   const accountId=localStorage.getItem('socialstart-active-account')||undefined
   setPublicPosts(current=>{
    const next=[...current]
    userPosts.forEach(post=>{const published={...post,ownerAccountId:post.ownerAccountId||accountId},found=next.findIndex(item=>item.id===post.id);if(found>=0)next[found]=published;else next.unshift(published)})
    return next
   })
  },[userPosts])
  useEffect(()=>persist('socialstart-saved-posts',savedPosts),[savedPosts])
  useEffect(()=>persist('socialstart-liked-posts',likedPostIds),[likedPostIds])
  useEffect(()=>persist('socialstart-viewed-posts',viewedPostIds),[viewedPostIds])
  useEffect(()=>persist('socialstart-post-metrics',postMetrics),[postMetrics])
  useEffect(()=>persist('socialstart-following',followingUsernames),[followingUsernames])
  useEffect(()=>persist('socialstart-global-follow-graph',followingByAccount),[followingByAccount])
  useEffect(()=>{const accountId=localStorage.getItem('socialstart-active-account');if(accountId)setFollowingByAccount(current=>({...current,[accountId]:followingUsernames}))},[followingUsernames])
  useEffect(()=>persist('socialstart-shares',shareCount),[shareCount])
  useEffect(()=>persist('socialstart-points',points),[points])
  useEffect(()=>persist('socialstart-global-creator-points',creatorPoints),[creatorPoints])
  useEffect(()=>persist('socialstart-locked-posts',lockedPosts),[lockedPosts])
  useEffect(()=>persist('socialstart-purchased-posts',purchasedPostIds),[purchasedPostIds])
  useEffect(()=>persist('socialstart-points-used',pointsUsed),[pointsUsed])
  useEffect(()=>persist('socialstart-balance',balance),[balance])
  useEffect(()=>persist('socialstart-unread-messages',unreadByConversation),[unreadByConversation])

  const addToCart=(item:Omit<CartItem,'quantity'>,quantity=1)=>setCart(current=>current.some(x=>x.id===item.id)?current.map(x=>x.id===item.id?{...x,quantity:Math.min(99,x.quantity+quantity)}:x):[...current,{...item,quantity}])
  const updateCartQuantity=(id:string,quantity:number)=>setCart(current=>quantity<=0?current.filter(x=>x.id!==id):current.map(x=>x.id===id?{...x,quantity:Math.min(99,quantity)}:x))
  const addUserPost=({title,image,mediaType='image',category,hashtags=[],mediaFilter,overlayText,overlayX,overlayY,trimStart,trimEnd}:{title:string;image:string;mediaType?:'image'|'video';category?:string;hashtags?:string[];mediaFilter?:string;overlayText?:string;overlayX?:number;overlayY?:number;trimStart?:number;trimEnd?:number})=>setUserPosts(current=>{
   const profile=read<Record<string,string>>('socialstart-settings-profile',{})
   registerPostHashtags(`${title} ${hashtags.map(tag=>`#${tag}`).join(' ')}`,profile.username||'alexmorgan')
   return [{
    id:`mine-${Date.now()}`,author:profile.name||'Alex Morgan',username:profile.username||'alexmorgan',avatar:profile.avatar||'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&auto=format&fit=crop',image,title,category:category||undefined,hashtags,location:profile.location||'Los Angeles, CA',likes:0,views:'0',followers:'0',following:false,mediaType,mediaFilter,overlayText,overlayX,overlayY,trimStart,trimEnd,ownerAccountId:localStorage.getItem('socialstart-active-account')||undefined
   } as Post,...current]
  })
  const toggleSavedPost=(post:Post)=>setSavedPosts(current=>current.some(x=>x.id===post.id)?current.filter(x=>x.id!==post.id):[post,...current])
  const togglePostLike=(id:string)=>setLikedPostIds(current=>{
   const removing=current.includes(id)
   setPostMetrics(metrics=>({...metrics,[id]:{likes:Math.max(0,(metrics[id]?.likes||0)+(removing?-1:1)),views:metrics[id]?.views||0}}))
   return removing?current.filter(x=>x!==id):[...current,id]
  })
  const toggleFollow=(username:string)=>setFollowingUsernames(current=>{
   if(current.includes(username))return current.filter(x=>x!==username)
   const profile=read<{name?:string;username?:string;avatar?:string}>('socialstart-settings-profile',{})
   const alert:FollowerAlert={id:`follow-${Date.now()}-${profile.username||'member'}`,targetUsername:username,followerUsername:profile.username||'member',name:profile.name||profile.username||'A SocialStart member',avatar:profile.avatar||'',createdAt:Date.now()}
   localStorage.setItem('socialstart-global-follower-alerts',JSON.stringify([...followerAlerts(),alert].slice(-200)))
   window.dispatchEvent(new Event('socialstart-follower-alert'))
   return [...current,username]
  })
  const viewPost=(id:string)=>{
   setViewedPostIds(current=>{
    if(current.includes(id))return current
    setPostMetrics(metrics=>({...metrics,[id]:{likes:metrics[id]?.likes||0,views:(metrics[id]?.views||0)+1}}))
    return [...current,id]
   })
  }
  const recordShare=()=>setShareCount(current=>current+1)
  const donatePoints=(username:string,amount:number)=>{if(!Number.isInteger(amount)||amount<1||amount>points)return false;setPoints(current=>current-amount);setPointsUsed(current=>current+amount);setCreatorPoints(current=>({...current,[username]:(current[username]||0)+amount}));return true}
  const setPostPrice=(id:string,price:number)=>setLockedPosts(current=>({...current,[id]:price}))
  const unlockPost=(id:string)=>setLockedPosts(current=>{const next={...current};delete next[id];return next})
  const purchasePost=(id:string)=>setPurchasedPostIds(current=>current.includes(id)?current:[...current,id])
  const deletePost=(id:string)=>{setUserPosts(current=>current.filter(post=>post.id!==id));setPublicPosts(current=>current.filter(post=>post.id!==id));setSavedPosts(current=>current.filter(post=>post.id!==id));setLikedPostIds(current=>current.filter(item=>item!==id));setPostMetrics(current=>{const next={...current};delete next[id];return next});setLockedPosts(current=>{const next={...current};delete next[id];return next});setPurchasedPostIds(current=>current.filter(item=>item!==id))}
  const giftViewPoints=(username:string,type:'image'|'video',amount:number)=>{
   if(!Number.isInteger(amount)||amount<1||amount>viewPoints[type])return false
   setViewPoints(current=>{const next={...current,[type]:current[type]-amount},all=read<Record<string,{image:number;video:number}>>('socialstart-view-points-by-account',{});all[accountId()]=next;localStorage.setItem('socialstart-view-points-by-account',JSON.stringify(all));localStorage.setItem(`socialstart-${type}-view-points-${accountId()}`,String(next[type]));scheduleCloudSave();return next})
   const gifts=read<Record<string,{image:number;video:number}>>('socialstart-received-view-points',{}),current=gifts[username]||{image:0,video:0};gifts[username]={...current,[type]:current[type]+amount};localStorage.setItem('socialstart-received-view-points',JSON.stringify(gifts));scheduleCloudSave();return true
  }
  const spendBalance=(amount:number)=>{if(amount<=0||amount>balance)return false;setBalance(current=>current-amount);return true}
  const unread=Object.values(unreadByConversation).reduce((total,count)=>total+count,0)
  const markConversationRead=(id:string)=>setUnreadByConversation(current=>current[id]?{...current,[id]:0}:current)
  return <Context.Provider value={{dark,setDark,unread,unreadByConversation,markConversationRead,points,pointsUsed,earnPoint:()=>setPoints(current=>current+1),viewPoints,giftViewPoints,creatorPoints,donatePoints,balance,addFunds:amount=>setBalance(current=>current+Math.max(0,amount)),spendBalance,postMetrics,cart,addToCart,updateCartQuantity,clearCart:()=>setCart([]),userPosts,publicPosts,addUserPost,deletePost,savedPosts,toggleSavedPost,isPostSaved:id=>savedPosts.some(x=>x.id===id),likedPostIds,togglePostLike,followingUsernames,followingByAccount,toggleFollow,viewPost,shareCount,recordShare,lockedPosts,setPostPrice,unlockPost,purchasedPostIds,purchasePost}}>{children}</Context.Provider>
}
export const useApp=()=>{const value=useContext(Context);if(!value)throw new Error('AppProvider missing');return value}
