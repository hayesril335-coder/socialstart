import { useState, type FormEvent } from 'react'
import { CreditCard, Crown, WalletCards } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { membershipPlanFor, purchaseMembership } from '../../lib/memberships'

type Billing = { cardName:string; cardNumber:string; expiry:string; cvv:string }
const emptyCard:Billing={cardName:'',cardNumber:'',expiry:'',cvv:''}
const readBilling=()=>{try{return {...emptyCard,...JSON.parse(localStorage.getItem('socialstart-settings-billing')||'{}')} as Billing}catch{return emptyCard}}

export function MembershipCheckoutPage(){
 const {username=''}=useParams(),navigate=useNavigate(),{balance,spendBalance}=useApp()
 const plan=membershipPlanFor(username),savedCard=readBilling(),hasSavedCard=Boolean(savedCard.cardNumber)
 const [method,setMethod]=useState<'balance'|'saved'|'new'>(balance>=(plan?.price||Infinity)?'balance':hasSavedCard?'saved':'new')
 const [card,setCard]=useState<Billing>(emptyCard),[error,setError]=useState('')
 if(!plan)return <div className="form-page membership-setup"><Crown/><h1>Membership unavailable</h1><p>This creator is not currently offering a subscription.</p></div>
 const complete=(billing?:Billing)=>{if(method==='balance'&&!spendBalance(plan.price)){setError('Your current balance is too low for this purchase.');return}if(billing)localStorage.setItem('socialstart-settings-billing',JSON.stringify(billing));purchaseMembership(username,plan.price);navigate(`/profile/${username}`)}
 const submit=(event:FormEvent)=>{event.preventDefault();complete(method==='new'?card:undefined)}
 return <form className="form-page membership-setup membership-checkout" onSubmit={submit}><Crown/><p className="eyebrow">MONTHLY MEMBERSHIP</p><h1>Choose how to pay</h1><p>Unlock all of {username}’s posts for <b>${plan.price.toFixed(2)}/month</b>. Your membership renews monthly.</p><div className="payment-options"><button type="button" className={method==='balance'?'selected':''} onClick={()=>setMethod('balance')}><WalletCards/><span><b>Current balance</b><small>${balance.toFixed(2)} available</small></span></button><button type="button" disabled={!hasSavedCard} className={method==='saved'?'selected':''} onClick={()=>setMethod('saved')}><CreditCard/><span><b>Saved payment info</b><small>{hasSavedCard?`Card ending in ${savedCard.cardNumber.slice(-4)}`:'No card saved in Settings'}</small></span></button><button type="button" className={method==='new'?'selected':''} onClick={()=>setMethod('new')}><CreditCard/><span><b>Use a new card</b><small>Save this card to Billing details</small></span></button></div>{method==='new'&&<div className="card-checkout"><label className="field">Name on card<input required value={card.cardName} onChange={event=>setCard({...card,cardName:event.target.value})}/></label><label className="field">Card number<input required inputMode="numeric" value={card.cardNumber} onChange={event=>setCard({...card,cardNumber:event.target.value})}/></label><div><label className="field">Expiration<input required placeholder="MM/YY" value={card.expiry} onChange={event=>setCard({...card,expiry:event.target.value})}/></label><label className="field">Security code<input required inputMode="numeric" value={card.cvv} onChange={event=>setCard({...card,cvv:event.target.value})}/></label></div></div>}{error&&<p className="auth-error">{error}</p>}<button className="primary-btn wide" type="submit">Purchase membership · ${plan.price.toFixed(2)}</button></form>
}
