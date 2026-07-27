import { useState } from 'react'
import { Hash, Plus, X } from 'lucide-react'

export function HashtagPicker({value,onChange}:{value:string[];onChange:(tags:string[])=>void}){
 const [draft,setDraft]=useState('')
 const add=()=>{const tag=draft.trim().replace(/^#/,'').replace(/[^a-zA-Z0-9_]/g,'').toLowerCase();if(!tag||value.includes(tag)||value.length>=5)return;onChange([...value,tag]);setDraft('')}
 return <div className="post-hashtag-picker"><label>Hashtags <small>Optional · up to 5</small></label><div>{value.map(tag=><button type="button" key={tag} onClick={()=>onChange(value.filter(item=>item!==tag))}><Hash/>{tag}<X/></button>)}</div>{value.length<5&&<div className="hashtag-entry"><input value={draft} onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();add()}}} placeholder="#hashtag"/><button type="button" onClick={add} disabled={!draft.trim()}><Plus/> Add</button></div>}</div>
}
