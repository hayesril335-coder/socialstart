import { useState } from 'react'
import { ImagePlus, Minus, Plus, Save, ShoppingBag, Store } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { products } from '../../utils/mockData'
import { useApp } from '../../context/AppContext'
export function StorePage(){
 const {username}=useParams()
 return <div className="store-page"><section className="store-hero"><p className="eyebrow">THE SHOP OF @{username}</p><h1>Sunday <em>Studio</em></h1><p>Objects for slower mornings and longer tables. Each piece is made by hand in small batches.</p><div><span>HANDMADE IN PORTLAND</span><span>SMALL BATCH</span><span>SHIPS WORLDWIDE</span></div></section><div className="section-heading"><div><p className="eyebrow">THE COLLECTION</p><h2>Made to be used</h2></div><ShoppingBag/></div><div className="product-grid">{products.map(p=><Link to={`/store/${username}/product/${p.id}`} key={p.id}><img src={p.image}/><div><b>{p.title}</b><span>${p.price.toFixed(2)}</span></div><small>{p.stock} available</small></Link>)}</div></div>
}
export function ProductDetailsPage(){
 const {productId}=useParams(),product=products.find(x=>x.id===productId)||products[0],{addToCart}=useApp();let quantity=1
 return <div className="product-detail"><img src={product.image}/><div><p className="eyebrow">SUNDAY STUDIO / CERAMICS</p><h1>{product.title}</h1><h2>${product.price.toFixed(2)}</h2><p>Wheel-thrown stoneware, finished in a soft satin glaze. Subtle variations make every piece completely unique.</p><div className="quantity"><button><Minus/></button><span>{quantity}</span><button><Plus/></button></div><button className="primary-btn wide" onClick={()=>addToCart({id:product.id,title:product.title,price:product.price,image:product.image})}>Add to bag · ${product.price.toFixed(2)}</button><small>{product.stock} in stock · Ships in 3–5 business days</small></div></div>
}
export function CheckoutPage(){const {cart}=useApp(),total=cart.reduce((s,x)=>s+x.price*x.quantity,0);return <div className="form-page"><p className="eyebrow">SECURE CHECKOUT</p><h1>Your bag</h1>{cart.length?cart.map(x=><div className="cart-row"><img src={x.image}/><div><b>{x.title}</b><span>Quantity {x.quantity}</span></div><strong>${(x.price*x.quantity).toFixed(2)}</strong></div>):<div className="empty">Your bag is waiting for something beautiful.</div>}<div className="order-total"><span>Total</span><b>${total.toFixed(2)}</b></div><button disabled={!cart.length} className="primary-btn wide">Continue to payment</button></div>}

type DraftProduct={id:number;title:string;quantity:number;price:number}
export function ManageStorePage(){
 const [storeName,setStoreName]=useState(''),[description,setDescription]=useState('')
 const [title,setTitle]=useState(''),[quantity,setQuantity]=useState(''),[price,setPrice]=useState('')
 const [products,setProducts]=useState<DraftProduct[]>([])
 const addProduct=()=>{if(!title||!quantity||!price)return;setProducts(current=>[...current,{id:Date.now(),title,quantity:Number(quantity),price:Number(price)}]);setTitle('');setQuantity('');setPrice('')}
 return <div className="manage-store-page">
  <section className="store-setup-header"><div><p className="eyebrow">YOUR ONLINE STORE</p><h1>{storeName||'Build your store'}</h1><p>{description||'Add a name and a short line that tells shoppers what makes your store special.'}</p></div><Store/></section>
  <section className="store-editor"><div className="store-form"><p className="eyebrow">STORE DETAILS</p><h2>Name your shop</h2><label className="field">Store name<input value={storeName} onChange={e=>setStoreName(e.target.value)} placeholder="Example: Sunday Studio"/></label><label className="field">Line under store name<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Tell people what you make or sell."/></label><button className="secondary-btn"><Save/> Save store details</button></div>
  <div className="product-form-panel"><p className="eyebrow">ADD A PRODUCT</p><h2>Your first listing</h2><button className="product-image-drop"><ImagePlus/><b>Add product photo</b><span>Upload a clear image of your product</span></button><label className="field">Product title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What are you selling?"/></label><div className="field-pair"><label className="field">Quantity<input min="1" type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} placeholder="0"/></label><label className="field">Price<input min="0" step="0.01" type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="$0.00"/></label></div><button onClick={addProduct} disabled={!title||!quantity||!price} className="primary-btn wide">Add product</button></div></section>
  <section className="store-products"><p className="eyebrow">YOUR PRODUCTS · {products.length}</p>{products.length===0?<div className="profile-empty"><ShoppingBag/><h3>No products yet</h3><p>Add your first product using the form above.</p></div>:<div className="draft-products">{products.map(product=><article key={product.id}><div><b>{product.title}</b><span>{product.quantity} available</span></div><strong>${product.price.toFixed(2)}</strong></article>)}</div>}</section>
 </div>
}
