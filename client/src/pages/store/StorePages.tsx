import { Minus, Plus, ShoppingBag } from 'lucide-react'
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
