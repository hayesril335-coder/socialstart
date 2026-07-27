import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type CartItem = { id:string; title:string; price:number; image:string; quantity:number }
type AppState = {
  dark:boolean; setDark:(v:boolean)=>void; unread:number; points:number; balance:number;
  cart:CartItem[]; addToCart:(item:Omit<CartItem,'quantity'>)=>void;
}
const Context = createContext<AppState | null>(null)
export function AppProvider({children}:{children:ReactNode}) {
  const [dark,setDarkState] = useState(() => localStorage.getItem('socialstart-theme') === 'dark')
  const [cart,setCart] = useState<CartItem[]>([])
  const setDark=(value:boolean)=>{setDarkState(value);localStorage.setItem('socialstart-theme',value?'dark':'light')}
  useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light'},[dark])
  const addToCart=(item:Omit<CartItem,'quantity'>)=>setCart(current=>current.some(x=>x.id===item.id)?current.map(x=>x.id===item.id?{...x,quantity:x.quantity+1}:x):[...current,{...item,quantity:1}])
  return <Context.Provider value={{dark,setDark,unread:3,points:284,balance:248.5,cart,addToCart}}>{children}</Context.Provider>
}
export const useApp=()=>{const value=useContext(Context);if(!value)throw new Error('AppProvider missing');return value}
