export type Post = { id:string; author:string; username:string; avatar:string; image:string; title:string; location:string; likes:number; views:string; followers:string; following:boolean; saved?:boolean; mediaType?:'image'|'video'|'live'; approximateLatitude?:number; approximateLongitude?:number }
export type Product = { id:string; title:string; price:number; image:string; stock:number }
