import type { Post, Product } from '../types'

export const posts: Post[] = [
  { id:'1', author:'Sofia Bell', username:'sofiabell', avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop', image:'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&auto=format&fit=crop', title:'Golden hour found me first.', location:'Silver Lake, CA', likes:2847, views:'18.2K', followers:'42.1K', following:false, approximateLatitude:34.086, approximateLongitude:-118.270 },
  { id:'2', author:'Mason Reed', username:'masonmakes', avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop', image:'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200&auto=format&fit=crop', title:'A quiet corner, made by hand.', location:'Portland, OR', likes:1196, views:'9.8K', followers:'18.4K', following:false, approximateLatitude:45.515, approximateLongitude:-122.678 },
  { id:'3', author:'Amara Jones', username:'amaragoes', avatar:'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=160&auto=format&fit=crop', image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop', title:'Somewhere between here and forever.', location:'Malibu, CA', likes:4321, views:'27.5K', followers:'67.3K', following:false, approximateLatitude:34.026, approximateLongitude:-118.780 }
]
export const products: Product[] = [
  {id:'p1',title:'Hand-thrown Oat Mug',price:38,image:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700&auto=format&fit=crop',stock:12},
  {id:'p2',title:'Ripple Vase',price:64,image:'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=700&auto=format&fit=crop',stock:5},
  {id:'p3',title:'Stoneware Bowl Set',price:72,image:'https://images.unsplash.com/photo-1611486212557-88be5ff6f941?w=700&auto=format&fit=crop',stock:8},
  {id:'p4',title:'Sunday Pour Over',price:48,image:'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=700&auto=format&fit=crop',stock:3}
]
