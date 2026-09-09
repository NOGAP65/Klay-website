import { useId } from 'react';

import { FABRIC_SHOT_DIR } from '@/features/catalogue/fabricShots';
import { awningColourCurves } from '@/features/catalogue/lib/awningColour';
import { useMediaQuery } from '@/shared';

import { usePhotoTransition } from './usePhotoTransition';

interface Props {
  file: string;
  colour: string;
  position: string;
  hardware?: boolean;
}

// Source coordinates (900 × 768). The old raster masks included wall and sky
// and classified the triangular right-hand fabric panel as metal.
const canopy = 'M171 69 L804 277 L806 312 L809 371 L588 452 L586 420 L314 335 Z';
const metal = [
  // The long cassette follows the steep diagonal beside the wall, not the
  // shallow diagonal of the near arm. Keep the wall's cast shadow untouched.
  'M143 96 L173 66 L313 321 Q321 333 315 342 Q310 352 301 343 Z',
  'M60 18 L68 21 L133 20 Q161 20 169 46 Q177 70 165 86 Q156 99 137 99 L79 99 L66 93 L58 85 Z',
  'M67 94 L88 99 L97 116 L102 132 L113 136 L112 146 L101 145 L90 131 L79 116 Z',
  'M111 98 L126 98 L127 126 L138 135 L127 149 L111 142 L100 133 L102 126 L111 127 Z',
  'M126 122 L160 133 L200 148 L270 177 L350 211 L420 240 L446 253 L453 256 L465 261 L500 265 L600 280 L700 295 L760 303 L770 305 L782 296 L788 303 L782 321 L775 328 L760 326 L700 317 L600 302 L500 288 L465 283 L448 283 L420 269 L350 237 L270 204 L200 175 L160 161 L126 149 L113 145 L116 132 Z',
  'M312 339 L434 372 L451 378 L580 410 L589 416 L584 422 L447 392 L431 388 L312 351 Z',
  'M589 410 L777 295 L796 281 L805 281 L804 288 L782 305 L593 418 L588 421 Z',
  'M796 280 Q809 275 816 283 Q823 293 816 300 L798 307 L795 303 L784 316 L780 314 L785 304 L789 293 Z',
];

function silhouette(hardware: boolean): string {
  // Fabric continues under the arms. The antialiased metal edge then blends
  // into coloured cloth rather than leaving an undyed ivory seam between masks.
  const parts = hardware ? metal.map(d => `<path d="${d}" fill="white"/>`).join('')
    : `<path d="${canopy}" fill="white"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="768" viewBox="0 0 900 768"><rect width="900" height="768" fill="black"/>${parts}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Recolour each material while preserving the photograph's local contrast. */
export function AwningColourLayer({ file, colour, position, hardware = false }: Props) {
  const id = `awning-${useId().replace(/:/g, '')}`;
  const isReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const frame = usePhotoTransition({ colour, hardware: colour }, isReduced);
  const curves = awningColourCurves(frame.colour, hardware);

  return (
    <>
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR type="table" tableValues={curves[0].join(' ')} />
            <feFuncG type="table" tableValues={curves[1].join(' ')} />
            <feFuncB type="table" tableValues={curves[2].join(' ')} />
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
