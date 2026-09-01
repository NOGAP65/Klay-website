// ---------------------------------------------------------------------------
// N-SLICE SCALING FOR THE WARDROBE ARTWORK.
//
// THE BUG THIS FIXES. The renders are photographs of real cabinets taken at one
// width. Show a different width and the artwork has to be resized — and the
// obvious way to do that, stretching the whole picture, is wrong, because a
// wardrobe is not a picture that scales. It is built out of standard parts:
//
//   THE SHELF AND DRAWER TOWER IS A FIXED 507mm MODULE at every width the range
//   is made in. It is one carcass, and it is the same carcass in a 1500 as in a
//   2700. What actually changes between them is the hang-rail span either side.
//
// Stretch the whole sticker and the drawers come out wider in a 3000 than in an
// 1800 — which is the one error a customer can check against their own eyes,
// because they have seen a chest of drawers before.
//
// So the artwork is cut into SEGMENTS. Fixed segments draw at true scale and
// never stretch; flex segments absorb the whole difference. The same idea as
// CSS border-image or a 9-slice UI sprite, and the same idea the geometry
// already uses — see MODULE_WIDTH_MM in wardrobeGeometry.
//
// WHY THIS EXISTS SEPARATELY FROM THE GEOMETRY. The geometry was already built
// out of fixed modules; what was still naive was the TEXTURE. The projection
// mapped model millimetres to sticker pixels with one linear remap across the
// whole cabinet, so a 507mm tower in an 1800 cabinet sampled 507/1800 of the
// picture while the tower actually occupies 507/2400 of it. Correct geometry,
// stretched pixels. This module is what makes the mapping piecewise.
//
// DERIVED FROM THE LAYOUT, NOT HAND-AUTHORED, and that is deliberate. A slice
// map written by hand is a second description of the cabinet, free to drift
// from the first one; taking the boundaries from columnsFor means the artwork
// is sliced exactly where the geometry puts its modules, and one edit moves
// both. `overrides` is there for the case where a supplied render does not match
// the spec and the boundary has to be measured off the file instead.
// ---------------------------------------------------------------------------

import { LAYOUT_COLUMNS, MODULE_WIDTH_MM } from './wardrobeGeometry';

export interface Segment {
  /** A fixed segment is a standard module and never stretches. A flex segment
   * is hanging space and absorbs whatever width is left over. */
  type: 'fixed' | 'flex';
  /** Its width in the REFERENCE cabinet, mm — the width the render was made at.
   * For a fixed segment this is also its width at every other cabinet width. */
  refWidthMm: number;
  /** Where its artwork lives in the source image, as a fraction of the whole
   * image (not of the carcass), so it is ready to use as a texture coordinate. */
  u0: number;
  u1: number;
}

export interface SliceMap {
  layoutId: string;
  /** The cabinet width the render was made at. */
  refWidthMm: number;
  segments: Segment[];
  /** Total of the fixed modules — the width below which this layout cannot be
   * built at all, because the modules alone would not fit. */
  fixedTotalMm: number;
  /** Narrowest cabinet this map should be asked for. See MIN_FLEX_MM. */
  minWidthMm: number;
}

/** A hang rail narrower than this is not a hang rail. A hanger is about 450mm
 * across, so a bay under that cannot take one however well the arithmetic
 * works out — the render would be correct and the product unbuildable. */
const MIN_FLEX_MM = 450;

/** The carcass box within the source image, plus the module boundaries measured
 * off the artwork — everything the cut-out manifest records about width. */
export interface CarcassBox {
  x0: number; x1: number;
  /** Where a fixed module ends / begins, as a fraction of the carcass. Null
   * where the detector could not read one. */
  towerLead?: number | null;
  towerTrail?: number | null;
}

/** Builds the slice map for one layout at the width its render was made at.
 *
 * Boundaries land at the CENTRE OF EACH DIVIDER rather than at a column edge,
 * so the 18mm board between two columns is shared and neither segment gets a
 * sliver of its neighbour's edge. At the ends the outer boards belong to the
 * outermost segments, which is what they are physically part of. */
export function buildSliceMap(
  layoutId: string,
  refWidthMm: number,
  carcass: CarcassBox,
): SliceMap {
  const columns = LAYOUT_COLUMNS[layoutId] ?? LAYOUT_COLUMNS['3.0'];
  const leadFixed = !!columns[0]?.fixed;
  const trailFixed = columns.length > 1 && !!columns[columns.length - 1]?.fixed;

  const span = carcass.x1 - carcass.x0;
  /** Carcass fraction to image u. */
  const toU = (f: number) => carcass.x0 + f * span;

  // MEASURED BOUNDARIES WHERE THERE ARE ANY, and this is the whole reason the
  // slicing can be trusted. Deriving them from the layout meant trusting the
  // recorded reference width, and four of the seven were wrong: 6.0 was filed
  // as an 1800 render when its tower measures 20.9% of the carcass, which at a
  // 507 module is a render nearer 2400. The boundary landed 8% too far right
  // and painted hanging garments onto the drawer fronts.
  //
  // The fallback is the old derivation, for an asset the detector could not
  // read — 4.9, whose three-quarter viewpoint means its dividers are not
  // vertical and the column profile has nothing sharp to find.
  const measuredLead = carcass.towerLead ?? null;
  const measuredTrail = carcass.towerTrail ?? null;
  const derivedFraction = (MODULE_WIDTH_MM / Math.max(1, refWidthMm));

  const leadEnd = leadFixed ? (measuredLead ?? derivedFraction) : null;
  const trailStart = trailFixed ? (measuredTrail ?? 1 - derivedFraction) : null;

  // ALL HANGING SPACE IS ONE FLEX REGION. A layout may have two bays with a
  // divider between them, but both are hanging space and both grow together, so
  // the divider inside them can ride along — and it is the one boundary the
  // detector cannot find reliably, because a coat hangs across it. Modelling it
  // would add a boundary that has to be right for no benefit.
  const segments: Segment[] = [];
  if (leadEnd !== null) {
    segments.push({ type: 'fixed', refWidthMm: MODULE_WIDTH_MM, u0: toU(0), u1: toU(leadEnd) });
  }
  segments.push({
    type: 'flex',
    refWidthMm: 0, // set below; a flex segment's reference width is not used
    u0: toU(leadEnd ?? 0),
    u1: toU(trailStart ?? 1),
  });
  if (trailStart !== null) {
    segments.push({ type: 'fixed', refWidthMm: MODULE_WIDTH_MM, u0: toU(trailStart), u1: toU(1) });
  }

  const fixedTotalMm = segments
    .filter(s => s.type === 'fixed')
    .reduce((sum, s) => sum + s.refWidthMm, 0);
  const flexCount = segments.filter(s => s.type === 'flex').length;

  return {
    layoutId,
    refWidthMm,
    segments,
    fixedTotalMm,
    minWidthMm: fixedTotalMm + flexCount * MIN_FLEX_MM,
  };
}

/** THE MAPPER: cabinet millimetres in, sticker U out, piecewise.
 *
 * This is the whole point of the module. Within a fixed segment the mapping is
 * one-to-one in millimetres, so the tower's artwork is drawn at exactly the
 * scale it was photographed at whatever cabinet it lands in. Within a flex
 * segment the source crop is stretched over however much hanging space is left,
 * which is correct — a longer rail really is a longer rail.
 *
 * Returns null when the layout cannot be built at this width, rather than
 * quietly drawing a cabinet narrower than its own modules.
 */
export function sliceMapper(
  map: SliceMap,
  selectedWidthMm: number,
): ((xMm: number) => number) | null {
  const flex = map.segments.filter(s => s.type === 'flex');
  const flexTotalMm = selectedWidthMm - map.fixedTotalMm;
  if (flex.length === 0) {
    // No flex at all: the layout is only ever its reference width.
    if (Math.abs(selectedWidthMm - map.refWidthMm) > 1) return null;
  } else if (flexTotalMm <= 0) {
    return null;
  }
  const flexEachMm = flex.length ? flexTotalMm / flex.length : 0;

  // Where each segment starts and ends in the SELECTED cabinet.
  const dst: { start: number; end: number; seg: Segment }[] = [];
  let cursor = 0;
  for (const seg of map.segments) {
    const w = seg.type === 'fixed' ? seg.refWidthMm : flexEachMm;
    dst.push({ start: cursor, end: cursor + w, seg });
    cursor += w;
  }

  return (xMm: number) => {
    // Clamped at both ends so a vertex a hair outside the cabinet — the 0.6px
    // bleed the triangle skinner adds — samples the edge rather than wrapping.
    if (xMm <= 0) return map.segments[0].u0;
    if (xMm >= cursor) return map.segments[map.segments.length - 1].u1;
    for (const d of dst) {
      if (xMm > d.end) continue;
      const w = d.end - d.start;
      const t = w > 0 ? (xMm - d.start) / w : 0;
      return d.seg.u0 + t * (d.seg.u1 - d.seg.u0);
    }
    return map.segments[map.segments.length - 1].u1;
  };
}

/** The total width a slice map actually renders at — the fixed modules plus
 * whatever the flex segments were given. Equals selectedWidthMm when it is
 * buildable, and is what the caller should lay the geometry out at. */
export function resolvedWidthMm(map: SliceMap, selectedWidthMm: number): number {
  return Math.max(map.minWidthMm, selectedWidthMm);
}

export interface PlannedSegment {
  type: 'fixed' | 'flex';
  /** Source crop in the image, as fractions of its width. */
  u0: number;
  u1: number;
  /** Where it lands, in cabinet millimetres. */
  dstStartMm: number;
  dstWidthMm: number;
}

/** THE RENDER PLAN: one entry per segment, source crop and destination.
 *
 * The flat-sticker form of the same mapping `sliceMapper` does per vertex. It
 * is not what this renderer draws with — the cabinet is modelled and the
 * artwork is projected onto its faces, so the mapping has to be a function of
 * position rather than a list of blits — but it is the honest statement of what
 * the slicing means, and it is what makes the invariant testable:
 *
 *     A FIXED SEGMENT'S dstWidthMm IS THE SAME AT EVERY SELECTED WIDTH.
 *
 * That is the whole property. If a QA pass ever sees the tower change size as
 * the width control moves, this function is where to look first. */
export function renderPlan(map: SliceMap, selectedWidthMm: number): PlannedSegment[] | null {
  const flex = map.segments.filter(s => s.type === 'flex');
  const flexTotalMm = selectedWidthMm - map.fixedTotalMm;
  if (flex.length === 0) {
    if (Math.abs(selectedWidthMm - map.refWidthMm) > 1) return null;
  } else if (flexTotalMm <= 0) {
    return null;
  }
  const flexEachMm = flex.length ? flexTotalMm / flex.length : 0;

  const out: PlannedSegment[] = [];
  let cursor = 0;
  for (const seg of map.segments) {
    const dstWidthMm = seg.type === 'fixed' ? seg.refWidthMm : flexEachMm;
    out.push({ type: seg.type, u0: seg.u0, u1: seg.u1, dstStartMm: cursor, dstWidthMm });
    cursor += dstWidthMm;
  }
  return out;
}
