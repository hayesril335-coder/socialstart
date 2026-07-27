import { X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { profiles, stories } from '../../utils/mockData'
export function StoryPage(){
 const {username}=useParams(),navigate=useNavigate(),profile=profiles.find(item=>item.username===username)||profiles[0],story=stories.find(item=>item.username===username)||stories[0]
 return <div className="story-viewer"><button onClick={()=>navigate(-1)} aria-label="Close story"><X/></button><div className="story-progress"><i/></div><header><img src={profile.avatar}/><div><b>{profile.name}</b><span>@{profile.username} · Story</span></div></header><img className="story-media" src={story.image}/><p>{story.caption}</p></div>
}
