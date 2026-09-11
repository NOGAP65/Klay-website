import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Current from '../../src/features/visualiser/Canvas2DCurtainRenderer';
import Previous from './PreviousCurtain';
import {scenes} from './scenes';

const params=new URLSearchParams(location.search);
const scene=scenes[params.get('scene')||'garden'];
const colours:Record<string,string>={white:'#F2F1EB',sand:'#CFC4AD',charcoal:'#333638',ivory:'#E8E2D4'};
function App(){
 const [photo,setPhoto]=useState<{url:string;width:number;height:number,corners:number[][]}>();
 useEffect(()=>{ const img=new Image(); img.onload=()=>{
   const [x,y,w,h]=scene.crop||[0,0,img.width,img.height];
   const crop=document.createElement('canvas');crop.width=w;crop.height=h;
   crop.getContext('2d')!.drawImage(img,x,y,w,h,0,0,w,h);
   setPhoto({url:scene.crop?crop.toDataURL():img.src,width:w,height:h,corners:scene.corners});
 }; img.src=scene.url; },[]);
 const Renderer=params.get('version')==='previous'?Previous:Current;
 const width=Number(params.get('width')||900);
 const type=params.get('type')==='blockout'?'blockout':'sheer';
 if(!photo)return null;
 const point=(i:number)=>({x:photo.corners[i][0]*photo.width,y:photo.corners[i][1]*photo.height});
 return <main style={{width,maxWidth:'100%',margin:'0 auto'}}>
   <div id="render" style={{position:'relative',width:'100%',aspectRatio:`${photo.width}/${photo.height}`}}>
     <Renderer tl={point(0)} tr={point(1)} br={point(2)} bl={point(3)} fabricType={type}
       colour={colours[params.get('colour')||'white']} hardwareColour="white" mount="ceiling" size="medium"
       openness={Number(params.get('open')||0)} canvasWidth={photo.width} canvasHeight={photo.height}
       photoUrl={photo.url} {...{dropMm:scene.drop}} />
   </div>
   <p style={{font:'14px Arial',margin:12}}>{scene.name} · {params.get('version')||'current'} · {type} · {params.get('colour')||'white'}</p>
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
