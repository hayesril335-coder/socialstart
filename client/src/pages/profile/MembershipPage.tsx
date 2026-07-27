import { useState } from 'react'
import { Crown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { saveMembershipPlan } from '../../lib/memberships'

export function MembershipPage() {
  const navigate = useNavigate()
  const profile = (() => { try { return JSON.parse(localStorage.getItem('socialstart-settings-profile') || '{}') as { username?: string } } catch { return {} } })()
  const [price, setPrice] = useState('7.99')
  const save = () => {
    const amount = Number(price)
    if (!profile.username || !Number.isFinite(amount) || amount <= 0) return
    saveMembershipPlan({ username: profile.username, price: amount, createdAt: Date.now() })
    navigate('/profile')
  }
  return <div className="form-page membership-setup"><Crown/><p className="eyebrow">CREATOR MEMBERSHIP</p><h1>Create a monthly subscription</h1><p>Members pay once each month to unlock every post on your profile. Creating this membership locks all of your current and future posts for non-members.</p><label className="field">Monthly amount<input type="number" min=".99" step=".01" value={price} onChange={event=>setPrice(event.target.value)}/></label><button className="primary-btn wide" disabled={Number(price)<=0} onClick={save}>Create subscription · ${Number(price||0).toFixed(2)}/month</button></div>
}
