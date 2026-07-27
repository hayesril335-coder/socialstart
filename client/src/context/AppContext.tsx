import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Post } from '../types'

export type CartItem = { id:string; title:string; price:number; image:string; quantity:number }
type AppState = {
  dark:boolean; setDark:(v:boolean)=>void; unread:number; points:number; balance:number;
  cart:CartItem[]; addToCart:(item:Omit<CartItem,'quantity'>,quantity?:number)=>void; updateCartQuantity:(id:string,quantity:number)=>void; clearCart:()=>void;
  userPosts:Post[]; addUserPost:(post:{title:string;image:string;mediaType?:'image'|'video'})=>void;
  savedPosts:Post[]; toggleSavedPost:(post:Post)=>void; isPostSaved:(id:string)=>boolean;
  likedPostIds:string[]; togglePostLike:(id:string)=>void; followingUsernames:string[]; toggleFollow:(username:string)=>void;
  viewPost:(id:string)=>void; shareCount:number; recordShare:()=>void;
}

const Context = createContext<AppState | null>(null)
const read=<T,>(key:string,fallback:T):T=>{try{return JSON.parse(localStorage.getItem(key)||'') as T}catch{return fallback}}
const persist=(key:string,value:unknown)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{/* Large video blobs remain available for this session. */}}

export function AppProvider({children}:{children:ReactNode}) {
  const [dark,setDarkState] = useState(() => localStorage.getItem('socialstart-theme') === 'dark')
  const [cart,setCart] = useState<CartItem[]>(()=>read('socialstart-cart',[]))
  const [userPosts,setUserPosts]=useState<Post[]>(()=>read('socialstart-user-posts',[]))
  const [savedPosts,setSavedPosts]=useState<Post[]>(()=>read('socialstart-saved-posts',[]))
  const [likedPostIds,setLikedPostIds]=useState<string[]>(()=>read('socialstart-liked-posts',[]))
  const [followingUsernames,setFollowingUsernames]=useState<string[]>(()=>read('socialstart-following',[]))
  const [shareCount,setShareCount]=useState(()=>read('socialstart-shares',0))
  const setDark=(value:boolean)=>{setDarkState(value);localStorage.setItem('socialstart-theme',value?'dark':'light')}
  useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light'},[dark])
  useEffect(()=>persist('socialstart-cart',cart),[cart])
  useEffect(()=>persist('socialstart-user-posts',userPosts),[userPosts])
  useEffect(()=>persist('socialstart-saved-posts',savedPosts),[savedPosts])
  useEffect(()=>persist('socialstart-liked-posts',likedPostIds),[likedPostIds])
  useEffect(()=>persist('socialstart-following',followingUsernames),[followingUsernames])
  useEffect(()=>persist('socialstart-shares',shareCount),[shareCount])

  const addToCart=(item:Omit<CartItem,'quantity'>,quantity=1)=>setCart(current=>current.some(x=>x.id===item.id)?current.map(x=>x.id===item.id?{...x,quantity:Math.min(99,x.quantity+quantity)}:x):[...current,{...item,quantity}])
  const updateCartQuantity=(id:string,quantity:number)=>setCart(current=>quantity<=0?current.filter(x=>x.id!==id):current.map(x=>x.id===id?{...x,quantity:Math.min(99,quantity)}:x))
  const addUserPost=({title,image,mediaType='image'}:{title:string;image:string;mediaType?:'image'|'video'})=>setUserPosts(current=>[{
   id:`mine-${Date.now()}`,author:'Alex Morgan',username:'alexmorgan',avatar:'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=300&auto=format&fit=crop',image,title,location:'Los Angeles, CA',likes:0,views:'0',followers:'0',following:false,mediaType
  } as Post,...current])
  const toggleSavedPost=(post:Post)=>setSavedPosts(current=>current.some(x=>x.id===post.id)?current.filter(x=>x.id!==post.id):[post,...current])
  const togglePostLike=(id:string)=>setLikedPostIds(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id])
  const toggleFollow=(username:string)=>setFollowingUsernames(current=>current.includes(username)?current.filter(x=>x!==username):[...current,username])
  const viewPost=(id:string)=>setUserPosts(current=>current.map(post=>post.id===id?{...post,views:String(Number(post.views)+1)}:post))
  const recordShare=()=>setShareCount(current=>current+1)
  return <Context.Provider value={{dark,setDark,unread:0,points:0,balance:0,cart,addToCart,updateCartQuantity,clearCart:()=>setCart([]),userPosts,addUserPost,savedPosts,toggleSavedPost,isPostSaved:id=>savedPosts.some(x=>x.id===id),likedPostIds,togglePostLike,followingUsernames,toggleFollow,viewPost,shareCount,recordShare}}>{children}</Context.Provider>
}
export const useApp=()=>{const value=useContext(Context);if(!value)throw new Error('AppProvider missing');return value}
