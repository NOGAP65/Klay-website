import type { Point } from './homography';

export interface BlindLighting {
  tint: [number, number, number];
  exposure: number;
  daylight: [number, number, number, number];
}

export const NEUTRAL_BLIND_LIGHT: BlindLighting = {
  tint: [1, 1, 1], exposure: 1, daylight: [0.8, 0.8, 0.8, 0.8],
};
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const luma = (rgb: number[]) => rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114;

/** Sample neutral room surfaces around the opening, excluding coloured foliage.
 * Daylight is averaged into four broad regions: it cannot reproduce an outdoor
 * scene through a privacy fabric, only the variation in its illumination. */
export function sampleBlindLighting(pixels: Uint8ClampedArray, width: number, height: number, quad: Point[]): BlindLighting {
  const [tl, tr, br, bl] = quad;
  const sample = (u: number, v: number): number[] => {
    const x = (tl[0] * (1-u) + tr[0] * u) * (1-v) + (bl[0] * (1-u) + br[0] * u) * v;
    const y = (tl[1] * (1-u) + tr[1] * u) * (1-v) + (bl[1] * (1-u) + br[1] * u) * v;
    const px = clamp(Math.round(x * (width-1)), 0, width-1);
    const py = clamp(Math.round(y * (height-1)), 0, height-1);
    const index = (py * width + px) * 4;
    return [pixels[index]/255, pixels[index+1]/255, pixels[index+2]/255];
  };
  const neutral: number[][] = [];
  for (let i=0; i<12; i++) {
    const t = (i+0.5)/12;
    for (const [u,v] of [[-0.07,t],[1.07,t],[t,-0.06]]) {
      const rgb = sample(u,v);
      if (luma(rgb)>0.28 && Math.max(...rgb)-Math.min(...rgb)<0.20) neutral.push(rgb);
    }
  }
  neutral.sort((a,b)=>luma(a)-luma(b));
  const bright = neutral.slice(Math.floor(neutral.length/2));
  const mean = bright.length ? [0,1,2].map(c=>bright.reduce((s,rgb)=>s+rgb[c],0)/bright.length) : [0.85,0.85,0.85];
  const peak = Math.max(...mean,0.01);
  const tint = mean.map(c=>0.60+0.40*c/peak) as BlindLighting['tint'];
  const exposure = clamp(0.70+0.30*luma(mean)/0.85,0.82,1.03);
  const daylight = [[0.25,0.25],[0.75,0.25],[0.75,0.75],[0.25,0.75]].map(([u,v])=>{
    let sum=0;
    for(let y=-2;y<=2;y++) for(let x=-2;x<=2;x++) sum+=luma(sample(u+x*0.08,v+y*0.08));
    return sum/25;
  }) as BlindLighting['daylight'];
  return {tint,exposure,daylight};
}

/** Fabric travels into the roll; the texture stays attached to the bottom rail.
 * Its scale is independent of how far down the blind has been lowered. */
export function blindTextureCoordinates(tileX: number, width: number, fullDrop: number, position: number) {
  const p = clamp(position,0,1);
  const fullScale = tileX*fullDrop/Math.max(1,width);
  return {uvScale:[tileX,Math.max(0.0001,fullScale*p)] as [number,number], uvOffset:fullScale*(1-p)};
}
