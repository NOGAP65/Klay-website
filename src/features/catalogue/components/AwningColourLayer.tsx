import { useId } from 'react';

import { FABRIC_SHOT_DIR } from '@/features/catalogue/fabricShots';

interface Props {
  file: string;
  colour: string;
  position: string;
  hardware?: boolean;
}

const linear = (value: number) => value <= 0.04045
  ? value / 12.92
  : ((value + 0.055) / 1.055) ** 2.4;

// Source coordinates (900 × 768). The old raster masks included wall and sky
// and classified the triangular right-hand fabric panel as metal.
const canopy = 'M169 68 L805 277 L810 374 L588 453 L586 419 L312 335 Z';
const metal = [
  'M59 20 L133 20 Q166 23 171 56 Q178 88 147 98 L62 99 Z',
  'M68 98 L91 98 L104 126 L121 130 L124 148 L98 147 L82 128 Z',
  'M109 122 L447 256 L466 264 L765 306 L786 295 L789 316 L774 328 L457 284 L441 280 L111 151 Z',
  'M107 155 L121 158 L316 326 L319 341 L311 349 L302 342 L300 331 Z',
  'M316 337 L582 410 L589 415 L581 422 L314 350 Z',
  'M582 410 L753 322 L764 324 L592 422 L582 422 Z',
  'M799 277 Q811 273 817 284 L821 294 L815 301 L796 310 L784 310 L784 298 Z',
];

function silhouette(hardware: boolean): string {
  const parts = metal.map(d => `<path d="${d}" fill="${hardware ? 'white' : 'black'}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="768" viewBox="0 0 900 768"><rect width="900" height="768" fill="black"/>${hardware ? '' : `<path d="${canopy}" fill="white"/>`}${parts}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Recolour the photograph in linear light, retaining its seams, texture,
 * shadows and metal joints. A small neutral surface reflection keeps dark
 * outdoor finishes readable without painting a flat highlight over them. */
export function AwningColourLayer({ file, colour, position, hardware = false }: Props) {
  const id = `awning-${useId().replace(/:/g, '')}`;
  // The source is warm ivory cloth and off-white powder coating.
  const reference = hardware ? [210, 205, 195] : [230, 223, 207];
  const reflection = hardware ? 0.02 : 0.03;
  const slopes = reference.map((channel, index) => {
    const selected = parseInt(colour.slice(1 + index * 2, 3 + index * 2), 16) / 255;
    return (linear(selected) * (1 - reflection) + reflection) / linear(channel / 255);
  });

  return (
    <>
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
        <filter id={id} colorInterpolationFilters="linearRGB">
          <feComponentTransfer>
            <feFuncR type="linear" slope={slopes[0]} />
            <feFuncG type="linear" slope={slopes[1]} />
            <feFuncB type="linear" slope={slopes[2]} />
          </feComponentTransfer>
        </filter>
      </svg>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        WebkitMaskImage: silhouette(hardware),
        maskImage: silhouette(hardware),
        maskMode: 'luminance',
        WebkitMaskSize: 'cover', maskSize: 'cover',
        WebkitMaskPosition: position, maskPosition: position,
      }}>
        <img src={`${FABRIC_SHOT_DIR}/${file}`} alt="" style={{
          width: '100%', height: '100%', display: 'block',
          objectFit: 'cover', objectPosition: position, filter: `url(#${id})`,
        }} />
      </div>
    </>
  );
}
