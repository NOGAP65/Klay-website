import { windowPlane, type Point } from './homography';

/** Sample the wall just outside the trace, not the sky through the glass or
 * unrelated image corners. Framing changes then keep the same local light. */
export function curtainRoomLight(pixels: Uint8ClampedArray, width:number, height:number, quad:Point[]) {
  const project=windowPlane(quad);
  const samples:number[][]=[];
  const sample=(u:number,v:number)=>{
    const [x,y]=project(u,v);
    if(x<0||x>=1||y<0||y>=1)return;
    const i=(Math.min(height-1,Math.floor(y*height))*width+Math.min(width-1,Math.floor(x*width)))*4;
    const rgb=[pixels[i],pixels[i+1],pixels[i+2]].map(c=>c/255);
    const high=Math.max(...rgb), low=Math.min(...rgb);
    if(high<0.14 || high-low>0.55 || (rgb[1]>rgb[0]*1.15 && rgb[1]>rgb[2]*1.15))return;
    samples.push(rgb);
  };
  for(let i=1;i<=12;i++) {
    const t=i/13;
    for(const offset of [0.025,0.055,0.09]) {
      sample(-offset,t);sample(1+offset,t);sample(t,-offset);
    }
  }
  if(samples.length<4)return {tint:[1,1,1] as [number,number,number],exposure:0.9};
  const luma=(rgb:number[])=>rgb[0]*0.299+rgb[1]*0.587+rgb[2]*0.114;
  samples.sort((a,b)=>luma(a)-luma(b));
  const walls=samples.slice(Math.floor(samples.length*0.45),Math.ceil(samples.length*0.85));
  const mean=[0,1,2].map(c=>walls.reduce((sum,rgb)=>sum+rgb[c],0)/walls.length);
  const high=Math.max(...mean);
  const tint=mean.map(value=>0.22+0.78*value/high) as [number,number,number];
  const brightness=Math.max(0.38,Math.min(1.0,luma(mean)+0.16));
  return {tint,exposure:brightness*brightness};
}
