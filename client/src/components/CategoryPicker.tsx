import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { postingCategories } from '../lib/categories'

export function CategoryPicker({value,onChange,label='Category (optional)'}:{value:string;onChange:(value:string)=>void;label?:string}){
 const [open,setOpen]=useState(false)
 return <div className="category-picker"><button type="button" className="category-trigger" onClick={()=>setOpen(true)}><span><small>{label}</small><b>{value||'Select a category'}</b></span><ChevronDown/></button>{open&&<div className="category-modal"><div><button className="modal-close" onClick={()=>setOpen(false)}><X/></button><p className="eyebrow">POSTING CATEGORIES</p><h2>Choose a category</h2><button className={!value?'selected':''} onClick={()=>{onChange('');setOpen(false)}}>No category</button>{postingCategories.map(category=><button className={value===category?'selected':''} key={category} onClick={()=>{onChange(category);setOpen(false)}}>{category}</button>)}</div></div>}</div>
}
