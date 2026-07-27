import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Post } from '../types'

export type CartItem = { id:string; title:string; price:number; image:string; quantity:number }
type AppState = {
  dark:boolean; setDark:(v:boolean)=>void; unread:number; unreadByConversation:Record<string,number>; markConversationRead:(id:string)=>void; points:number; pointsUsed:number; earnPoint:()=>void; creatorPoints:Record<string,number>; donatePoints:(username:string,amount:number)=>boolean; balance:number; addFunds:(amount:number)=>void; spendBalance:(amount:number)=>boolean;
  cart:CartItem[]; addToCart:(item:Omit<CartItem,'quantity'>,quantity?:number)=>void; updateCartQuantity:(id:string,quantity:number)=>void; clearCart:()=>void;
  userPosts:Post[]; publicPosts:Post[]; addUserPost:(post:{title:string;image:string;mediaType?:'image'|'video'})=>void;
  savedPosts:Post[]; toggleSavedPost:(post:Post)=>void; isPostSaved:(id:string)=>boolean;
  likedPostIds:string[]; togglePostLike:(id:string)=>void; followingUsernames:string[]; toggleFollow:(username:string)=>void;
  viewPost:(id:string)=>void; shareCount:number; recordShare:()=>void;
  lockedPosts:Record<string,number>; setPostPrice:(id:string,price:number)=>void; unlockPost:(id:string)=>void; purchasedPostIds:string[]; purchasePost:(id:string)=>void;
}

const Context = createContext<AppState | null>(null)
const read=<T,>(key:string,fallback:T):T=>{try{return JSON.parse(localStorage.getItem(key)||'') as T}catch{return fallback}}
const persist=(key:string,value:unknown)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{/* Large video blobs remain available for this session. */}}
const readPublicPosts=()=>{
 const combined=read<Post[]>('socialstart-public-posts',[])
 for(let index=0;index<localStorage.length;index++){
  const key=localStorage.key(index)
  if(!key?.startsWith('socialstart-account-data-'))continue
  try{
   const accountId=key.slice('socialstart-account-data-'.length),snapshot=JSON.parse(localStorage.getItem(key)||'{}') as Record<string,string>
   const accountPosts=JSON.parse(snapshot['socialstart-user-posts']||'[]') as Post[]
   accountPosts.forEach(post=>{if(!combined.some(item=>item.id===post.id))combined.push({...post,ownerAccountId:post.ownerAccountId||accountId})})
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
  const [followingUsernames,setFollowingUsernames]=useState<string[]>(()=>read('socialstart-following',[]))
  const [shareCount,setShareCount]=useState(()=>read('socialstart-shares',0))
  const [points,setPoints]=useState(()=>read('socialstart-points',0))
  const [creatorPoints,setCreatorPoints]=useState<Record<string,number>>(()=>read('socialstart-creator-points',{}))
  const [lockedPosts,setLockedPosts]=useState<Record<string,number>>(()=>read('socialstart-locked-posts',{}))
  const [purchasedPostIds,setPurchasedPostIds]=useState<string[]>(()=>read('socialstart-purchased-posts',[]))
  const [pointsUsed,setPointsUsed]=useState(()=>read('socialstart-points-used',0))
  const [balance,setBalance]=useState(()=>read('socialstart-balance',0))
  const [unreadByConversation,setUnreadByConversation]=useState<Record<string,number>>(()=>read('socialstart-unread-messages',{welcome:1}))
  const setDark=(value:boolean)=>{setDarkState(value);localStorage.setItem('socialstart-theme',value?'dark':'light')}
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
  useEffect(()=>persist('socialstart-following',followingUsernames),[followingUsernames])
  useEffect(()=>persist('socialstart-shares',shareCount),[shareCount])
  useEffect(()=>persist('socialstart-points',points),[points])
  useEffect(()=>persist('socialstart-creator-points',creatorPoints),[creatorPoints])
  useEffect(()=>persist('socialstart-locked-posts',lockedPosts),[lockedPosts])
  useEffect(()=>persist('socialstart-purchased-posts',purchasedPostIds),[purchasedPostIds])
  useEffect(()=>persist('socialstart-points-used',pointsUsed),[pointsUsed])
  useEffect(()=>persist('socialstart-balance',balance),[balance])
  useEffect(()=>persist('socialstart-unread-messages',unreadByConversation),[unreadByConversation])

  const addToCart=(item:Omit<CartItem,'quantity'>,quantity=1)=>setCart(current=>current.some(x=>x.id===item.id)?current.map(x=>x.id===item.id?{...x,quantity:Math.min(99,x.quantity+quantity)}:x):[...current,{...item,quantity}])
  const updateCartQuantity=(id:string,quantity:number)=>setCart(current=>quantity<=0?current.filter(x=>x.id!==id):current.map(x=>x.id===id?{...x,quantity:Math.min(99,quantity)}:x))
  const addUserPost=({title,image,mediaType='image'}:{title:string;image:string;mediaType?:'image'|'video'})=>setUserPosts(current=>{
   const profile=read<Record<string,string>>('socialstart-settings-profile',{})
   return [{
    id:`mine-${Date.now()}`,author:profile.name||'Alex Morgan',username:profile.username||'alexmorgan',avatar:profile.avatar||'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&auto=format&fit=crop',image,title,location:profile.location||'Los Angeles, CA',likes:0,views:'0',followers:'0',following:false,mediaType,ownerAccountId:localStorage.getItem('socialstart-active-account')||undefined
   } as Post,...current]
  })
  const toggleSavedPost=(post:Post)=>setSavedPosts(current=>current.some(x=>x.id===post.id)?current.filter(x=>x.id!==post.id):[post,...current])
  const togglePostLike=(id:string)=>setLikedPostIds(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id])
  const toggleFollow=(username:string)=>setFollowingUsernames(current=>current.includes(username)?current.filter(x=>x!==username):[...current,username])
  const viewPost=(id:string)=>setUserPosts(current=>current.map(post=>post.id===id?{...post,views:String(Number(post.views)+1)}:post))
  const recordShare=()=>setShareCount(current=>current+1)
  const donatePoints=(username:string,amount:number)=>{if(!Number.isInteger(amount)||amount<1||amount>points)return false;setPoints(current=>current-amount);setPointsUsed(current=>current+amount);setCreatorPoints(current=>({...current,[username]:(current[username]||0)+amount}));return true}
  const setPostPrice=(id:string,price:number)=>setLockedPosts(current=>({...current,[id]:price}))
  const unlockPost=(id:string)=>setLockedPosts(current=>{const next={...current};delete next[id];return next})
  const purchasePost=(id:string)=>setPurchasedPostIds(current=>current.includes(id)?current:[...current,id])
  const spendBalance=(amount:number)=>{if(amount<=0||amount>balance)return false;setBalance(current=>current-amount);return true}
  const unread=Object.values(unreadByConversation).reduce((total,count)=>total+count,0)
  const markConversationRead=(id:string)=>setUnreadByConversation(current=>current[id]?{...current,[id]:0}:current)
  return <Context.Provider value={{dark,setDark,unread,unreadByConversation,markConversationRead,points,pointsUsed,earnPoint:()=>setPoints(current=>current+1),creatorPoints,donatePoints,balance,addFunds:amount=>setBalance(current=>current+Math.max(0,amount)),spendBalance,cart,addToCart,updateCartQuantity,clearCart:()=>setCart([]),userPosts,publicPosts,addUserPost,savedPosts,toggleSavedPost,isPostSaved:id=>savedPosts.some(x=>x.id===id),likedPostIds,togglePostLike,followingUsernames,toggleFollow,viewPost,shareCount,recordShare,lockedPosts,setPostPrice,unlockPost,purchasedPostIds,purchasePost}}>{children}</Context.Provider>
}
export const useApp=()=>{const value=useContext(Context);if(!value)throw new Error('AppProvider missing');return value}
