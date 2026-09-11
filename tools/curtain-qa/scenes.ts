export type Scene = { name:string; url:string; crop?:number[]; corners:number[][]; drop:number };
export const scenes:Record<string,Scene> = {
  garden: {name:'Garden room',url:'/images/visualiser/rooms/curtain-shop-room.webp',corners:[[.067,.057],[.943,.057],[.943,.790],[.067,.790]],drop:2400},
  bedroom: {name:'Bedroom wall-to-wall',url:'/images/visualiser/rooms/curtain-bedroom.webp',corners:[[.052,.099],[.946,.099],[.946,.762],[.052,.762]],drop:2400},
  living: {name:'Large living room doors',url:'/images/visualiser/rooms/curtain-open-plan-living.webp',corners:[[.056,.055],[.944,.055],[.944,.748],[.056,.748]],drop:2400},
  oblique: {name:'Angled bedroom',url:'/images/visualiser/preview.png',corners:[[.1918,.1989],[.5841,.2492],[.583,.6382],[.1864,.6699]],drop:1400},
  sliding: {name:'Oblique sliding doors',url:'./rooms.webp',crop:[0,0,768,512],corners:[[145/768,40/512],[620/768,118/512],[615/768,390/512],[147/768,439/512]],drop:2100},
  sash: {name:'Overcast sash window',url:'./rooms.webp',crop:[768,0,768,512],corners:[[337/768,42/512],[507/768,11/512],[507/768,431/512],[337/768,407/512]],drop:1800},
  picture: {name:'Wide window, camera tilted up',url:'./rooms.webp',crop:[0,512,768,512],corners:[[159/768,116/512],[654/768,18/512],[709/768,480/512],[116/768,402/512]],drop:2400},
  casement: {name:'Distant evening casement',url:'./rooms.webp',crop:[768,512,768,512],corners:[[286/768,50/512],[408/768,37/512],[428/768,404/512],[302/768,386/512]],drop:1800},
  awning: {name:'Short wide awning window',url:'./rooms-extra.webp',crop:[0,0,768,512],corners:[[139/768,99/512],[636/768,98/512],[639/768,281/512],[138/768,280/512]],drop:1200},
  french: {name:'Timber French doors',url:'./rooms-extra.webp',crop:[768,0,768,512],corners:[[233/768,59/512],[592/768,0],[593/768,480/512],[234/768,409/512]],drop:2100},
  bay: {name:'Bay centre pane',url:'./rooms-extra.webp',crop:[0,512,768,512],corners:[[311/768,77/512],[491/768,77/512],[493/768,347/512],[311/768,347/512]],drop:1500},
  tall: {name:'Tall window, steep upward view',url:'./rooms-extra.webp',crop:[768,512,768,512],corners:[[302/768,12/512],[480/768,60/512],[522/768,478/512],[263/768,486/512]],drop:2800},
};
