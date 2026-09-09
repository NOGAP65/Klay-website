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
