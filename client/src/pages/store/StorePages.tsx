import { useState } from 'react'
import { ImagePlus, Minus, Plus, Save, ShoppingBag, Store } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { products } from '../../utils/mockData'
import { useApp } from '../../context/AppContext'

export function StorePage(){
 const {username}=useParams()
 return <div className="store-page"><section className="store-hero"><p className="eyebrow">THE SHOP OF @{username}</p><h1>Sunday <em>Studio</em></h1><p>Objects for slower mornings and longer tables. Each piece is made by hand in small batches.</p><div><span>HANDMADE IN PORTLAND</span><span>SMALL BATCH</span><span>SHIPS WORLDWIDE</span></div></section><div className="section-heading"><div><p className="eyebrow">THE COLLECTION</p><h2>Made to be used</h2></div><ShoppingBag/></div><div className="product-grid">{products.map(p=><Link to={`/store/${username}/product/${p.id}`} key={p.id}><img src={p.image}/><div><b>{p.title}</b><span>${p.price.toFixed(2)}</span></div><small>{p.stock} available</small></Link>)}</div></div>
}

export function ProductDetailsPage(){
 const {productId}=useParams(),navigate=useNavigate(),product=products.find(x=>x.id===productId)||products[0],{addToCart}=useApp(),[quantity,setQuantity]=useState(1)
 return <div className="product-detail"><img src={product.image}/><div><p className="eyebrow">SUNDAY STUDIO / CERAMICS</p><h1>{product.title}</h1><h2>${product.price.toFixed(2)}</h2><p>Wheel-thrown stoneware, finished in a soft satin glaze. Subtle variations make every piece completely unique.</p><div className="quantity"><button onClick={()=>setQuantity(current=>Math.max(1,current-1))} aria-label="Decrease quantity"><Minus/></button><span>{quantity}</span><button onClick={()=>setQuantity(current=>Math.min(product.stock,current+1))} aria-label="Increase quantity"><Plus/></button></div><button className="primary-btn wide" onClick={()=>{addToCart({id:product.id,title:product.title,price:product.price,image:product.image},quantity);navigate('/checkout')}}>Add to bag · ${(product.price*quantity).toFixed(2)}</button><small>{product.stock} in stock · Ships in 3–5 business days</small></div></div>
}

export function CheckoutPage(){
 const {cart,updateCartQuantity,clearCart}=useApp(),[confirming,setConfirming]=useState(false),[complete,setComplete]=useState(false),total=cart.reduce((sum,item)=>sum+item.price*item.quantity,0)
 if(complete)return <div className="form-page centered"><div className="purchase-success"><ShoppingBag/><p className="eyebrow">ORDER CONFIRMED</p><h1>Thank you for your purchase.</h1><p>Your order has been placed and the seller will receive the details.</p><Link className="primary-btn" to="/search">Continue shopping</Link></div></div>
 return <div className="form-page"><p className="eyebrow">SECURE CHECKOUT</p><h1>{confirming?'Confirm purchase':'Your bag'}</h1>{cart.length?cart.map(item=><div className="cart-row" key={item.id}><img src={item.image}/><div><b>{item.title}</b><div className="cart-quantity"><button onClick={()=>updateCartQuantity(item.id,item.quantity-1)}><Minus/></button><span>{item.quantity}</span><button onClick={()=>updateCartQuantity(item.id,item.quantity+1)}><Plus/></button></div></div><strong>${(item.price*item.quantity).toFixed(2)}</strong></div>):<div className="empty">Your bag is waiting for something beautiful.</div>}<div className="order-total"><span>Total</span><b>${total.toFixed(2)}</b></div>{confirming?<><div className="confirm-note">Confirm that you want to purchase these items for <b>${total.toFixed(2)}</b>.</div><button disabled={!cart.length} onClick={()=>{setComplete(true);clearCart()}} className="primary-btn wide">Confirm purchase</button><button onClick={()=>setConfirming(false)} className="checkout-back">Back to bag</button></>:<button disabled={!cart.length} onClick={()=>setConfirming(true)} className="primary-btn wide">Continue to confirm purchase</button>}</div>
}

type DraftProduct={id:number;title:string;quantity:number;price:number}
export function ManageStorePage(){
 const [storeName,setStoreName]=useState(''),[description,setDescription]=useState('')
 const [title,setTitle]=useState(''),[quantity,setQuantity]=useState(''),[price,setPrice]=useState('')
 const [storeProducts,setStoreProducts]=useState<DraftProduct[]>([])
 const addProduct=()=>{if(!title||!quantity||!price)return;setStoreProducts(current=>[...current,{id:Date.now(),title,quantity:Number(quantity),price:Number(price)}]);setTitle('');setQuantity('');setPrice('')}
 return <div className="manage-store-page">
  <section className="store-setup-header"><div><p className="eyebrow">YOUR ONLINE STORE</p><h1>{storeName||'Build your store'}</h1><p>{description||'Add a name and a short line that tells shoppers what makes your store special.'}</p></div><Store/></section>
  <section className="store-editor"><div className="store-form"><p className="eyebrow">STORE DETAILS</p><h2>Name your shop</h2><label className="field">Store name<input value={storeName} onChange={e=>setStoreName(e.target.value)} placeholder="Example: Sunday Studio"/></label><label className="field">Line under store name<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Tell people what you make or sell."/></label><button className="secondary-btn"><Save/> Save store details</button></div>
  <div className="product-form-panel"><p className="eyebrow">ADD A PRODUCT</p><h2>Your first listing</h2><button className="product-image-drop"><ImagePlus/><b>Add product photo</b><span>Upload a clear image of your product</span></button><label className="field">Product title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What are you selling?"/></label><div className="field-pair"><label className="field">Quantity<input min="1" type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="0"/></label><label className="field">Price<input min="0" step="0.01" type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="$0.00"/></label></div><button onClick={addProduct} disabled={!title||!quantity||!price} className="primary-btn wide">Add product</button></div></section>
  <section className="store-products"><p className="eyebrow">YOUR PRODUCTS · {storeProducts.length}</p>{storeProducts.length===0?<div className="profile-empty"><ShoppingBag/><h3>No products yet</h3><p>Add your first product using the form above.</p></div>:<div className="draft-products">{storeProducts.map(product=><article key={product.id}><div><b>{product.title}</b><span>{product.quantity} available</span></div><strong>${product.price.toFixed(2)}</strong></article>)}</div>}</section>
 </div>
}
