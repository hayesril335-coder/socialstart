import type { Post, Product } from '../types'

export const profiles=[
 {name:'Sofia Bell',username:'sofiabell',avatar:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop',bio:'Light chaser. Storyteller. Taking the scenic route, always.',location:'Silver Lake, CA'},
 {name:'Mason Reed',username:'masonmakes',avatar:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop',bio:'Furniture maker and collector of quiet corners.',location:'Portland, OR'},
 {name:'Amara Jones',username:'amaragoes',avatar:'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&auto=format&fit=crop',bio:'Ocean air, open roads, and stories from both.',location:'Malibu, CA'},
 {name:'Theo Brooks',username:'theocooks',avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop',bio:'Cooking simple food and sharing every lesson.',location:'Echo Park, CA'},
 {name:'Nia Chen',username:'niainmotion',avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop',bio:'Movement, wellness, and mornings outside.',location:'Santa Monica, CA'},
 {name:'Luca Hayes',username:'lucafilm',avatar:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop',bio:'Filmmaker finding small stories in big cities.',location:'Downtown LA, CA'}
]
export const stories=[
 {username:'sofiabell',image:'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&auto=format&fit=crop',caption:'Last light in the neighborhood.'},
 {username:'masonmakes',image:'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1200&auto=format&fit=crop',caption:'Sketching the next piece.'},
 {username:'amaragoes',image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop',caption:'The road was worth taking.'},
 {username:'theocooks',image:'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&auto=format&fit=crop',caption:'Tonight’s ingredients.'},
 {username:'niainmotion',image:'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&auto=format&fit=crop',caption:'A little movement every day.'},
 {username:'lucafilm',image:'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop',caption:'One frame from today.'}
]
const p=(id:string,person:number,image:string,title:string,location:string,likes:number,views:string,lat:number,lng:number,mediaType:'image'|'video'|'live'='image'):Post=>({id,author:profiles[person].name,username:profiles[person].username,avatar:profiles[person].avatar,image,title,location,likes,views,followers:['42.1K','18.4K','67.3K','12.8K','31.5K','23.9K'][person],following:false,approximateLatitude:lat,approximateLongitude:lng,mediaType})
export const posts:Post[]=[
 p('1',0,'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&auto=format&fit=crop','Golden hour found me first.','Silver Lake, CA',2847,'18.2K',34.086,-118.270),
 p('2',1,'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200&auto=format&fit=crop','A quiet corner, made by hand.','Portland, OR',1196,'9.8K',45.515,-122.678),
 p('3',2,'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop','Somewhere between here and forever.','Malibu, CA',4321,'27.5K',34.026,-118.780),
 p('4',3,'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&auto=format&fit=crop','Making dinner with what we have.','Echo Park, CA',1830,'14.1K',34.078,-118.260),
 p('5',4,'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop','Morning movement by the water.','Santa Monica, CA',3210,'22.7K',34.019,-118.491),
 p('6',5,'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop','Behind the scenes of something new.','Downtown LA, CA',2412,'16.6K',34.040,-118.250),
 p('7',0,'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&auto=format&fit=crop','A slow Saturday downtown.','Los Angeles, CA',912,'6.4K',34.052,-118.244),
 p('8',1,'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1200&auto=format&fit=crop','The first cut is always the hardest.','Portland, OR',756,'4.9K',45.520,-122.674),
 p('9',2,'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1200&auto=format&fit=crop','Stayed for the last light.','Topanga, CA',3876,'25.3K',34.093,-118.602),
 p('10',3,'https://www.w3schools.com/html/mov_bbb.mp4','LIVE: Sunday brunch together.','Echo Park, CA',604,'1.2K',34.078,-118.260,'live'),
 p('11',4,'https://www.w3schools.com/html/mov_bbb.mp4','LIVE: Twenty-minute morning flow.','Santa Monica, CA',840,'2.8K',34.019,-118.491,'live'),
 p('12',5,'https://www.w3schools.com/html/mov_bbb.mp4','LIVE: Editing the final scene.','Downtown LA, CA',1120,'3.6K',34.040,-118.250,'live'),
 p('13',0,'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop','Found music around every corner.','Los Feliz, CA',1490,'11.2K',34.112,-118.285)
]
export const products:Product[]=[
 {id:'p1',title:'Hand-thrown Oat Mug',price:38,image:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700&auto=format&fit=crop',stock:12},
 {id:'p2',title:'Ripple Vase',price:64,image:'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=700&auto=format&fit=crop',stock:5},
 {id:'p3',title:'Stoneware Bowl Set',price:72,image:'https://images.unsplash.com/photo-1611486212557-88be5ff6f941?w=700&auto=format&fit=crop',stock:8},
 {id:'p4',title:'Sunday Pour Over',price:48,image:'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=700&auto=format&fit=crop',stock:3}
]
