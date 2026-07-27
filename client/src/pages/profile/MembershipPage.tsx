import { useState } from 'react'
import { Crown, DollarSign, OctagonX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { endMembershipPlan, membershipPlanFor, saveMembershipPlan } from '../../lib/memberships'

export function MembershipPage() {
  const navigate = useNavigate()
  const profile = (() => { try { return JSON.parse(localStorage.getItem('socialstart-settings-profile') || '{}') as { username?: string } } catch { return {} } })()
  const existing = profile.username ? membershipPlanFor(profile.username) : null
  const [price, setPrice] = useState(existing?.price.toFixed(2) || '7.99')
  const [editingPrice, setEditingPrice] = useState(false)
  const save = () => {
    const amount = Number(price)
    if (!profile.username || !Number.isFinite(amount) || amount <= 0) return
    saveMembershipPlan({ username: profile.username, price: amount, createdAt: existing?.createdAt || Date.now() })
    navigate('/profile')
  }
  if(existing)return <div className="form-page membership-setup membership-edit"><Crown/><p className="eyebrow">CREATOR MEMBERSHIP</p><h1>Edit subscription</h1><p>Your membership is currently <b>${existing.price.toFixed(2)}/month</b>. Changes apply to future renewals.</p><div className="membership-edit-options"><button onClick={()=>setEditingPrice(value=>!value)}><DollarSign/><span><b>Change price</b><small>Set a new monthly membership price</small></span></button>{editingPrice&&<div className="membership-price-editor"><label className="field">New monthly amount<input type="number" min=".99" step=".01" value={price} onChange={event=>setPrice(event.target.value)}/></label><button className="primary-btn wide" disabled={Number(price)<=0} onClick={save}>Save new price · ${Number(price||0).toFixed(2)}/month</button></div>}<button className="end-membership" onClick={()=>{if(profile.username&&window.confirm('End your subscription service? New members will no longer be able to join.')){endMembershipPlan(profile.username);navigate('/profile')}}}><OctagonX/><span><b>End service</b><small>Stop offering this monthly membership</small></span></button></div></div>
  return <div className="form-page membership-setup"><Crown/><p className="eyebrow">CREATOR MEMBERSHIP</p><h1>Create a monthly subscription</h1><p>Members pay once each month to unlock every post on your profile. Creating this membership locks all of your current and future posts for non-members.</p><label className="field">Monthly amount<input type="number" min=".99" step=".01" value={price} onChange={event=>setPrice(event.target.value)}/></label><button className="primary-btn wide" disabled={Number(price)<=0} onClick={save}>Create subscription · ${Number(price||0).toFixed(2)}/month</button></div>
}
