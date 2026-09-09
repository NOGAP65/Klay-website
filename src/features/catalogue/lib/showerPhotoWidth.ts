export interface ShowerFitting {
  /** Include its contact shadow in the photo crop, but tint only the metal. */
  footprint: string;
  metal: string;
  anchor: 'wall' | 'free';
}

export interface ShowerPhoto {
  background: string;
  mounting: 'clip' | 'channel';
  left: number;
  right: number;
  top: number;
  bottom: number;
  referenceWidthMm: number;
  fittings: ShowerFitting[];
  channel?: string;
  cornerRadius?: number;
  cornerHeight?: number;
  glass?: 'clear' | 'reeded';
}

/** The free corner keeps its radius as the panel gets wider. */
export function showerGlassPath(photo: ShowerPhoto, right: number) {
  const radius = photo.cornerRadius ?? 0;
  const rise = photo.cornerHeight ?? radius;
  const corner = radius > 0
    ? `H${right - radius}A${radius} ${rise} 0 0 1 ${right} ${photo.top + rise}`
    : `H${right}`;
  return `M${photo.left - 2} ${photo.top}${corner}V${photo.bottom + 2}H${photo.left - 2}Z`;
}

/** Trace just the photographed free edge, including its rounded top corner. */
export function showerFreeEdgePath(photo: ShowerPhoto) {
  const radius = photo.cornerRadius ?? 0;
  const rise = photo.cornerHeight ?? radius;
  return radius > 0
    ? `M${photo.right - radius} ${photo.top}A${radius} ${rise} 0 0 1 ${photo.right} ${photo.top + rise}V${photo.bottom}`
    : `M${photo.right} ${photo.top}V${photo.bottom}`;
}

/** Crop the photographed glass in place; only its free edge moves. The room,
 * wall fixings, height and the size of every clip remain unchanged. */
export function showerPhotoWidth(photo: ShowerPhoto, widthMm: number) {
  const width = (photo.right - photo.left) * widthMm / photo.referenceWidthMm;
  return {
    left: photo.left,
    right: photo.left + width,
    top: photo.top,
    bottom: photo.bottom,
    width,
    height: photo.bottom - photo.top,
    edgeOffset: photo.left + width - photo.right,
  };
}
