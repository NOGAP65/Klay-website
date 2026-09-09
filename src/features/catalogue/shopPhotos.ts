import type { JoineryPhotoWidth } from './lib/joineryPhotoWidth';
import type { ShowerPhoto } from './lib/showerPhotoWidth';
import type { SemiScreenPhoto } from './lib/semiScreenPhoto';

export type PhotoMaterial = 'cellular' | 'day' | 'mesh' | 'shutter' | 'hardware';
export interface PhotoRegion { path: string; material: PhotoMaterial }
export interface BoardFace { path: string; grain: 'vertical' | 'horizontal' | 'surface' }
export interface ShopPhoto {
  src: string;
  description: string;
  regions?: PhotoRegion[];
  boards?: BoardFace[];
  metal?: string;
  /** Scale of the installation in this photograph, pixels per millimetre. */
  boardScale?: number;
  joinery?: JoineryPhotoWidth;
  shower?: ShowerPhoto;
  semi?: SemiScreenPhoto;
  mirror?: { framed: boolean };
  cabinetMirror?: boolean;
}

// Traced on the 1024px photographs. Keep the camera and these silhouettes
// together: recolouring must never include the plaster or the cast shadows.
const face = (path: string, grain: BoardFace['grain'] = 'horizontal'): BoardFace => ({ path, grain });
const rectangle = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;
const front = (x: number, y: number, w: number, h: number) => face(rectangle(x, y, w, h));
const upright = (path: string) => face(path, 'vertical');
const surface = (path: string) => face(path, 'surface');

// Follow the small accordion edge instead of painting a rectangle over the
// window reveal. The middle rail of Day & Night stays its original metal.
function cellularEdge(top: number, bottom: number): string {
  const left: string[] = [`M201 ${top}`];
  const right: string[] = [`L890 ${bottom}`];
  for (let y = top; y < bottom; y += 17) {
    left.push(`L204 ${Math.min(y + 8, bottom)} L201 ${Math.min(y + 17, bottom)}`);
  }
  for (let y = bottom; y > top; y -= 17) {
    right.push(`L887 ${Math.max(y - 8, top)} L890 ${Math.max(y - 17, top)}`);
  }
  return [...left, ...right, 'Z'].join(' ');
}

const forma1: ShopPhoto = {
  src: '/images/shop/wardrobes-srdh.webp', description: 'Forma 1 — shelf and two hanging rails fitted into an alcove',
  boardScale: 0.34,
  joinery: { modelId: 'SRDH', start: 163, top: 191, bottom: 826, columns: [
    { end: 514, leftReturn: 27, rightReturn: 8 }, { end: 860, leftReturn: 6, rightReturn: 27 },
  ] },
  boards: [front(163, 191, 697, 11), surface('M163 202H860L829 221H194Z'),
    upright('M509 203H518V319L516 326H510Z')],
  metal: 'M178 223Q180 219 182 223V228H508V237H182V241H178Z M519 228H842V223Q844 219 847 223V241H842V237H519Z',
};
const forma2: ShopPhoto = {
  src: '/images/shop/wardrobes-srstdh02.webp', description: 'Forma 2 — six shelf compartments, double hanging and long hanging',
  boardScale: 0.33,
  joinery: { modelId: 'SRSTDH02', start: 163, top: 154, bottom: 825, columns: [
    { end: 306 }, { end: 585, leftReturn: 27, rightReturn: 13 },
    { end: 861, leftReturn: 6, rightReturn: 33 },
  ] },
  boards: [
    front(164, 154, 697, 9), surface('M164 163H861L830 184H194Z'),
    upright('M163 163H170L194 184V794L170 824H163Z'),
    upright('M302 163H310L326 184V781L310 825H302Z'),
    upright('M580 163H590V825H582L572 781V184Z'),
    front(171, 270, 131, 9), surface('M171 279H302V285H194Z'),
    front(171, 380, 131, 8), surface('M171 388H302V395H194Z'),
    surface('M194 487H302V492H171Z'), front(171, 492, 131, 8),
    surface('M194 589H302V603H171Z'), front(171, 603, 131, 8),
    surface('M194 684H302V707H171Z'), front(171, 707, 131, 8),
    surface('M194 793H302V814H171Z'), front(171, 814, 131, 10),
    surface('M326 464H572L582 467H310Z'), front(310, 467, 272, 8),
  ],
  metal: 'M318 185H322V191H573V185H577V206H573V200H322V206H318Z M590 191H842V185H847V206H842V200H590Z M318 487H322V493H573V487H577V508H573V502H322V508H318Z',
};
const forma3: ShopPhoto = {
  src: '/images/shop/wardrobes-srdtdh01.webp', description: 'Forma 3 — four drawers, three open compartments and hanging rails',
  boardScale: 0.33,
  joinery: { modelId: 'SRDTDH01', start: 162, top: 160, bottom: 823, columns: [
    { end: 331 }, { end: 603, leftReturn: 26, rightReturn: 14 },
    { end: 862, leftReturn: 5, rightReturn: 32 },
  ] },
  boards: [
    front(162, 160, 700, 9), surface('M162 169H862L830 192H194Z'),
    upright('M162 169H167L194 192V518L167 528V819H162Z'),
    upright('M326 169H336L351 192V781L336 822H326Z'),
    upright('M598 169H607V823H598L589 781V192Z'),
    front(167, 288, 159, 8), surface('M167 296H326V306H194Z'),
    front(167, 405, 159, 8), surface('M167 413H326V418H194Z'),
    surface('M194 512H326V520H167Z'), front(167, 520, 159, 8),
    front(167, 529, 158, 66), front(167, 597, 158, 66),
    front(167, 665, 158, 67), front(167, 734, 158, 67), front(167, 802, 159, 17),
    front(336, 366, 261, 8), surface('M336 374H597L589 379H351Z'),
  ],
  metal: 'M342 190H347V196H591V190H595V211H591V205H347V211H342Z M608 196H844V190H849V211H844V205H608Z M342 390H347V396H591V390H595V411H591V405H347V411H342Z '
    + [561, 629, 698, 767].map(y => rectangle(225, y, 37, 5)).join(' '),
};
const linen1: ShopPhoto = {
  src: '/images/shop/shelving-lin01.webp', description: 'Linen 1 — four fitted shelves in a narrow alcove', boardScale: 0.40,
  joinery: { modelId: 'LIN01', start: 277, top: 195, bottom: 930, columns: [
    { end: 749, leftReturn: 26, rightReturn: 29 },
  ] },
  boards: [front(277, 195, 472, 13), surface('M277 208H749L720 232H303Z'),
    front(278, 383, 471, 12), surface('M278 395H749L720 402H303Z'),
    surface('M303 559H720L749 576H278Z'), front(278, 576, 471, 11),
    surface('M303 720H720L749 756H278Z'), front(278, 756, 471, 12)],
};
const linen2: ShopPhoto = {
  src: '/images/shop/shelving-lin02.webp', description: 'Linen 2 — four continuous shelves with one front support', boardScale: 0.40,
  joinery: { modelId: 'LIN02', start: 176, top: 213, bottom: 904, columns: [
    { end: 918, leftReturn: 31, rightReturn: 37, posts: [{ start: 537, end: 552 }] },
  ] },
  boards: [front(176, 213, 742, 12), surface('M176 225H918L881 249H207Z'),
    front(176, 383, 742, 12), surface('M176 395H918L881 402H207Z'),
    surface('M207 553H881L918 568H176Z'), front(176, 568, 742, 12),
    surface('M207 711H881L918 745H176Z'), front(176, 745, 742, 11),
    upright('M537 225H552V904H537Z')],
};
const linen5: ShopPhoto = {
  src: '/images/shop/shelving-lin05.webp', description: 'Linen 5 — four continuous shelves with two front supports', boardScale: 0.36,
  joinery: { modelId: 'LIN05', start: 113, top: 239, bottom: 858, columns: [
    { end: 970, leftReturn: 30, rightReturn: 34,
      posts: [{ start: 377, end: 394 }, { start: 679, end: 695 }] },
  ] },
  boards: [front(113, 239, 857, 12), surface('M113 251H970L936 267H143Z'),
    front(113, 407, 857, 12), surface('M113 419H970L936 426H143Z'),
    surface('M143 564H936L970 576H113Z'), front(113, 576, 857, 12),
    surface('M143 708H936L970 734H113Z'), front(113, 734, 857, 12),
    upright('M377 251H390L394 267V846L390 858H377Z'),
    upright('M683 251H695V858H683L679 846V267Z')],
};
const linenBroom: ShopPhoto = {
  src: '/images/shop/shelving-linbr02.webp', description: 'Linen Broom — four shelf levels and a full-height broom bay', boardScale: 0.37,
  joinery: { modelId: 'LINBR02', start: 114, top: 229, bottom: 860, columns: [
    { end: 723.5, leftReturn: 33, rightReturn: 22.5, posts: [{ start: 411, end: 424 }] },
    { end: 976, leftReturn: 5.5, rightReturn: 33 },
  ] },
  boards: [front(114, 229, 862, 11), surface('M114 240H976L943 258H147Z'),
    front(114, 391, 603, 12), surface('M114 403H717L700 409H147Z'),
    surface('M147 540H700L717 552H114Z'), front(114, 552, 603, 11),
    surface('M147 680H700L717 706H114Z'), front(114, 706, 603, 12),
    upright('M411 240H424V856H411Z'), upright('M718 240H729V860H719L701 821V258Z')],
};

const showerRoom = {
  background: '/images/shop/shower-screen-bathroom.webp',
  left: 181, right: 680, top: 85, bottom: 872, referenceWidthMm: 1400,
};
const clipScreen: ShopPhoto = {
  src: '/images/shop/shower-screen-clip.webp',
  description: 'Clear fixed shower panel with discreet wall and floor clips',
  shower: { ...showerRoom, mounting: 'clip', fittings: [
    { anchor: 'wall', footprint: rectangle(176, 131, 27, 30), metal: rectangle(179, 134, 20, 23) },
    { anchor: 'wall', footprint: rectangle(176, 794, 27, 31), metal: rectangle(179, 797, 20, 24) },
    { anchor: 'wall', footprint: rectangle(249, 855, 30, 24), metal: 'M253 858H273V874H253Z' },
    { anchor: 'free', footprint: rectangle(606, 855, 29, 24), metal: 'M609 858H629V874H609Z' },
  ] },
};
const channelScreen: ShopPhoto = {
  src: '/images/shop/shower-screen-channel.webp',
  description: 'Clear fixed shower panel in slim wall and floor channels',
  shower: { ...showerRoom, mounting: 'channel', fittings: [],
    channel: 'M178 84H187V866H680V875H178Z',
  },
};

function radiusScreen(src: string, mounting: 'clip' | 'channel', glass: 'clear' | 'reeded'): ShopPhoto {
  const base = mounting === 'clip' ? clipScreen : channelScreen;
  return { ...base, src,
    description: `Radius corner fixed frameless — ${glass === 'reeded' ? 'narrow-reeded' : 'clear'} glass, ${mounting} fixed`,
    shower: { ...base.shower!, glass,
      right: mounting === 'clip' ? 664 : 679,
      cornerRadius: mounting === 'clip' ? 114 : 110,
      cornerHeight: mounting === 'clip' ? 130 : 125,
    },
  };
}

function semiScreen(layout: SemiScreenPhoto['layout']): ShopPhoto {
  const isFront = layout === 'front-only';
  const right = isFront ? 756 : 722;
  const bottom = isFront ? 923 : 920;
  const frontMetal = `M145 111H159V869H145Z M${right - 17} 78H${right}V${bottom}H${right - 17}Z M181 122H193V138H181Z M181 846H193V859H181Z M373 496Q382 491 391 498L393 503Q383 510 374 506Q369 502 373 496Z`;
  return { src: isFront ? '/images/shop/shower-semi-front-only.webp' : '/images/shop/shower-semi-frameless.webp',
    description: `Semi-frameless ${isFront ? 'front only' : 'front and return'} showerscreen — clear glass`,
    semi: { layout, right,
      background: isFront ? '/images/shop/shower-semi-front-bathroom.webp' : '/images/shop/shower-semi-bathroom.webp',
      reflections: '/images/shop/shower-semi-reflections.webp',
      metal: frontMetal + (isFront ? '' : ' M722 79L862 147V158L722 91Z M722 906L855 824L862 834L722 920Z M854 149H862V834L854 838Z'),
      rails: `M157 111L${right} 77V89L157 123Z M145 856L${right} ${bottom - 14}V${bottom}L145 869Z`,
      doorEdge: `M${isFront ? 406 : 404} 109h2v770h-2Z`,
    },
  };
}

export const SHOP_PHOTOS: Record<string, Record<string, ShopPhoto>> = {
  'mirrors-with-cabinets': { default: { src: '/images/shop/mirrors-cabinets-open.webp',
    description: 'Shaped mirror with a white storage cabinet', cabinetMirror: true } },
  'mirrors-without-frames': { default: { src: '/images/shop/mirrors-quiet.webp',
    description: 'Frameless mirror above a travertine vanity', mirror: { framed: false } } },
  'mirror-with-frame': { default: { src: '/images/shop/mirrors-quiet.webp',
    description: 'Framed mirror above a travertine vanity', mirror: { framed: true } } },
  'honeycomb-blinds': {
    blockout: { src: '/images/shop/honeycomb-blockout.webp', description: 'Blockout honeycomb — opaque cellular fabric with accordion pleats',
      regions: [{ path: cellularEdge(112, 666), material: 'cellular' }] },
    daynight: { src: '/images/shop/honeycomb-daynight.webp', description: 'Day & Night honeycomb — translucent upper cells and opaque lower cells',
      regions: [{ path: cellularEdge(112, 404), material: 'day' }, { path: cellularEdge(415, 666), material: 'cellular' }] },
  },
  'roller-shutters': { default: {
    src: '/images/shop/roller-shutters.webp', description: 'Aluminium roller shutter mounted outside a house window',
    regions: [{ material: 'shutter', path: 'M172 166H869Q879 190 872 232H867V652H173V232H169Q163 202 169 172Z' }],
  } },
  'zip-guide-systems': { default: {
    src: '/images/shop/zip-guide-alfresco.webp', description: 'Alfresco zip screen fitted between patio posts, with a view through the mesh to the garden',
    regions: [{ material: 'mesh', path: 'M128 181H929V799H128Z' }],
  } },
  wardrobes: { SRDH: forma1, SRSTDH02: forma2, SRDTDH01: forma3 },
  shelving: { LIN01: linen1, LIN02: linen2, LIN05: linen5, LINBR02: linenBroom },
  'frameless-shower-screens': { clip: clipScreen, channel: channelScreen },
  'semi-frameless-front-only': { default: semiScreen('front-only') },
  'semi-frameless-front-return': { default: semiScreen('front-return') },
  'radius-corner-fixed-frameless': {
    'clip-clear': radiusScreen('/images/shop/shower-radius-clip-clear.webp', 'clip', 'clear'),
    'channel-clear': radiusScreen('/images/shop/shower-radius-channel-clear.webp', 'channel', 'clear'),
    'clip-reeded': radiusScreen('/images/shop/shower-radius-clip-reeded.webp', 'clip', 'reeded'),
    'channel-reeded': radiusScreen('/images/shop/shower-radius-channel-reeded.webp', 'channel', 'reeded'),
  },
};

export function shopPhoto(product: string, variant?: string, glass?: string): ShopPhoto | undefined {
  const photos = SHOP_PHOTOS[product];
  return photos?.[`${variant ?? 'clip'}-${glass ?? 'clear'}`]
    ?? photos?.[variant ?? 'default'] ?? (photos ? Object.values(photos)[0] : undefined);
}
