import { scheduleCloudSave } from './cloudSync'

export const hashtagRanks=['Founder','Co Founder','Diamond Member','Gold Member','Silver Member','Bronze Member','Member'] as const
export type HashtagRank=typeof hashtagRanks[number]
export type HashtagRecord={tag:string;founder:string;createdAt:number;ranks:Record<string,HashtagRank>}

const registryKey='socialstart-hashtag-registry'
const followedKey='socialstart-followed-hashtags'
const read=<T,>(key:string,fallback:T):T=>{try{return JSON.parse(localStorage.getItem(key)||'') as T}catch{return fallback}}
const clean=(tag:string)=>tag.trim().replace(/^#/,'').replace(/[^a-zA-Z0-9_]/g,'').toLowerCase()
export const extractHashtags=(text:string)=>[...new Set(Array.from(text.matchAll(/#([a-zA-Z0-9_]+)/g),match=>clean(match[1])).filter(Boolean))]
export const hashtagRegistry=()=>read<Record<string,HashtagRecord>>(registryKey,{})
export const followedHashtags=()=>read<string[]>(followedKey,[])
const saveRegistry=(registry:Record<string,HashtagRecord>)=>{localStorage.setItem(registryKey,JSON.stringify(registry));scheduleCloudSave();window.dispatchEvent(new Event('socialstart-hashtags-updated'))}
export const followHashtag=(rawTag:string,username:string)=>{
 const tag=clean(rawTag);if(!tag)return ''
 const followed=followedHashtags();if(!followed.includes(tag))localStorage.setItem(followedKey,JSON.stringify([...followed,tag]))
 const registry=hashtagRegistry()
 if(registry[tag]&&!registry[tag].ranks[username]){registry[tag].ranks[username]='Member';saveRegistry(registry)}
 scheduleCloudSave();window.dispatchEvent(new Event('socialstart-hashtags-updated'));return tag
}
export const unfollowHashtag=(rawTag:string)=>{const tag=clean(rawTag);localStorage.setItem(followedKey,JSON.stringify(followedHashtags().filter(item=>item!==tag)));scheduleCloudSave();window.dispatchEvent(new Event('socialstart-hashtags-updated'))}
export const registerPostHashtags=(title:string,username:string)=>{
 const registry=hashtagRegistry(),owned=Object.values(registry).filter(item=>item.founder===username).length
 let founderCount=owned
 extractHashtags(title).forEach(tag=>{
  if(!registry[tag]&&founderCount<10){registry[tag]={tag,founder:username,createdAt:Date.now(),ranks:{[username]:'Founder'}};founderCount++}
  else if(registry[tag]&&!registry[tag].ranks[username])registry[tag].ranks[username]='Member'
 })
 saveRegistry(registry)
}
export const setHashtagRank=(rawTag:string,username:string,rank:HashtagRank)=>{
 const tag=clean(rawTag),registry=hashtagRegistry(),record=registry[tag];if(!record)return
 record.ranks[username]=username===record.founder?'Founder':rank==='Founder'?'Co Founder':rank
 saveRegistry(registry)
}
export const rankFor=(rawTag:string,username:string):HashtagRank|undefined=>hashtagRegistry()[clean(rawTag)]?.ranks[username]
export const ownedHashtags=(username:string)=>Object.values(hashtagRegistry()).filter(item=>item.founder===username)
export const createHashtag=(rawTag:string,username:string)=>{
 const tag=clean(rawTag),registry=hashtagRegistry();if(!tag||registry[tag]||ownedHashtags(username).length>=10)return ''
 registry[tag]={tag,founder:username,createdAt:Date.now(),ranks:{[username]:'Founder'}};saveRegistry(registry);followHashtag(tag,username);return tag
}
export const rankPriority:Record<HashtagRank,number>={'Founder':0,'Co Founder':1,'Diamond Member':2,'Gold Member':3,'Silver Member':4,'Bronze Member':5,'Member':6}
export const rankBoostHours:Record<HashtagRank,number>={'Founder':12,'Co Founder':24,'Diamond Member':48,'Gold Member':96,'Silver Member':144,'Bronze Member':192,'Member':Number.POSITIVE_INFINITY}
