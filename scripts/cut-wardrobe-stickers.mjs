// ---------------------------------------------------------------------------
// CUTTING THE SUPPLIED WARDROBE STICKERS OUT OF THEIR CHECKERBOARD.
//
// Run:  node scripts/cut-wardrobe-stickers.mjs
//
// Reads  public/images/Textures/wardrobes/Forma Wardrobe *.png
// Writes public/images/Textures/wardrobes/<id>-white-<view>.png   (real alpha)
//        src/visualiser-lab/wardrobeCutouts.ts                    (manifest)
//
// WHY THIS EXISTS AT ALL. wardrobes.ts used to carry a long note saying these
// stickers could not be keyed: "the checkerboard that reads as transparency is
// painted into them as pixels, so it had to be guessed at from colour -- and
// against a white carcass those guesses went wrong in both directions". That is
// true of a COLOUR threshold and it is why the runtime keyer kept eating
// cabinetry. It is not true of the file.
//
// The checkerboard is SYNTHETIC: two flat greys on a regular grid. So the test
// does not have to be "is this pixel pale enough to be background", which a
// white melamine panel passes. It can be POSITIONAL:
//
//     a pixel is background only if it sits on one of the two grey levels
//     AND the OTHER level sits exactly one square away.
//
// Melamine cannot satisfy that however close its colour gets, because melamine
// has melamine beside it, not the checker's partner grey. That is the shirt-
// versus-panel discrimination no colour test could ever make.
//
// And because the background is then KNOWN rather than estimated, the edge is
// un-matted rather than keyed: obs = a*F + (1-a)*B solves for both the coverage
// and the true colour, so there is no grey fringe left behind.
//
// NO DEPENDENCIES. PNG is inflate plus a per-scanline filter, and zlib is in
// the standard library, so pulling in sharp for one build step that runs when
// the artwork changes would be the larger cost.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync, deflateSync } from 'node:zlib';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DIR = join(ROOT, 'public/images/Textures/wardrobes');
const CONTENTS = join(DIR, 'contents');
const MANIFEST = join(ROOT, 'src/visualiser-lab/wardrobeCutouts.ts');

// --- PNG ------------------------------------------------------------------

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/** Decodes a non-interlaced 8-bit RGB or RGBA PNG to flat RGBA. */
function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  let pos = 8;
  let width = 0, height = 0, colorType = 0, bitDepth = 0;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error('interlaced PNG not supported');
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }

  if (bitDepth !== 8) throw new Error(`bit depth ${bitDepth} not supported`);
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels) throw new Error(`colour type ${colorType} not supported`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 4);
  const prev = Buffer.alloc(stride);
  const line = Buffer.alloc(stride);

  let rp = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++];
    raw.copy(line, 0, rp, rp + stride);
    rp += stride;

    // Un-filter, per the PNG spec's reconstruction functions.
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? line[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[i] = v & 0xff;
    }
    line.copy(prev);

    for (let x = 0; x < width; x++) {
      const s = x * channels;
      const d = (y * width + x) * 4;
      out[d] = line[s];
      out[d + 1] = line[s + 1];
      out[d + 2] = line[s + 2];
      out[d + 3] = channels === 4 ? line[s + 3] : 255;
    }
  }

  return { width, height, data: out };
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const BPP = 4;

  // FULLY TRANSPARENT PIXELS ARE FLATTENED TO ZERO FIRST. A cut-out is mostly
  // transparent, and under those pixels sits whatever the checkerboard used to
  // be -- invisible, but still varying, so deflate has to store all of it. The
  // large empty margins compress to almost nothing once they are actually
  // uniform.
  for (let i = 0; i < width * height; i++)
    if (rgba[i * 4 + 3] === 0) { rgba[i * 4] = 0; rgba[i * 4 + 1] = 0; rgba[i * 4 + 2] = 0; }

  // ADAPTIVE FILTERING, chosen per scanline by the minimum-sum-of-absolute-
  // differences heuristic the spec itself suggests.
  //
  // Filter 0 throughout was the first version, on the reasoning that
  // photographic data deflates well anyway. It does not: the ten cut-outs came
  // to 23MB, heavier than the originals they were made from, which is a lot to
  // send a phone. Predicting each byte from its neighbours leaves deflate a
  // signal that is mostly near zero, and that is where the saving is.
  const raw = Buffer.alloc((stride + 1) * height);
  const prior = Buffer.alloc(stride);
  const line = Buffer.alloc(stride);
  const cand = [Buffer.alloc(stride), Buffer.alloc(stride), Buffer.alloc(stride), Buffer.alloc(stride), Buffer.alloc(stride)];

  for (let y = 0; y < height; y++) {
    rgba.copy(line, 0, y * stride, (y + 1) * stride);
    let best = 0;
    let bestScore = Infinity;

    for (let f = 0; f < 5; f++) {
      const out = cand[f];
      let score = 0;
      for (let i = 0; i < stride; i++) {
        const a = i >= BPP ? line[i - BPP] : 0;
        const b = prior[i];
        const c = i >= BPP ? prior[i - BPP] : 0;
        let v;
        if (f === 0) v = line[i];
        else if (f === 1) v = line[i] - a;
        else if (f === 2) v = line[i] - b;
        else if (f === 3) v = line[i] - ((a + b) >> 1);
        else {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = line[i] - (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
        }
        v &= 0xff;
        out[i] = v;
        // Signed magnitude: a byte near 0 or near 255 is a small residual.
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) { bestScore = score; best = f; }
    }

    raw[y * (stride + 1)] = best;
    cand[best].copy(raw, y * (stride + 1) + 1);
    line.copy(prior);
  }

  const chunk = (type, data) => {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, 'ascii');
    data.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
    return out;
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  return Buffer.concat([
    SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- the cut --------------------------------------------------------------

const T0 = 3.5;    // indistinguishable from the checker
const T1 = 14.0;   // unambiguously the product

function cut({ width: w, height: h, data: px }) {
  const at = (x, y) => px[(y * w + x) * 4];
  const neutral = i => {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    return Math.max(r, g, b) - Math.min(r, g, b) <= 5;
  };

  // THE TWO GREYS, from the border ring's own histogram. Fitting the grid PHASE
  // was the first approach and it kept mis-locking, which removes one colour of
  // square and leaves the other -- a checkerboard of survivors rather than a
  // clean cut. Only the two levels are actually needed, and the ring is all
  // background, so a histogram of it cannot get them wrong.
  const hist = new Int32Array(256);
  const ring = (x, y) => { const i = y * w + x; if (neutral(i)) hist[px[i * 4]]++; };
  for (let y = 0; y < 3; y++) for (let x = 0; x < w; x++) { ring(x, y); ring(x, h - 1 - y); }
  for (let x = 0; x < 3; x++) for (let y = 3; y < h - 3; y++) { ring(x, y); ring(w - 1 - x, y); }

  let p1 = 0;
  for (let v = 0; v < 256; v++) if (hist[v] > hist[p1]) p1 = v;
  let p2 = -1;
  for (let v = 0; v < 256; v++) {
    if (Math.abs(v - p1) < 4) continue;
    if (p2 < 0 || hist[v] > hist[p2]) p2 = v;
  }
  if (p2 < 0 || hist[p2] < hist[p1] / 8) p2 = p1;
  const L = Math.max(p1, p2), D = Math.min(p1, p2);

  // THE PITCH, by autocorrelation of the top border: it alternates with period
  // 2*sq, so the lag of maximum mean absolute difference is one square.
  let sq = 22, bestDiff = -1;
  for (let lag = 6; lag <= 60; lag++) {
    let sum = 0, n = 0;
    for (let y = 0; y < 2; y++)
      for (let x = 0; x + lag < w; x += 3) { sum += Math.abs(at(x + lag, y) - at(x, y)); n++; }
    const m = n ? sum / n : 0;
    if (m > bestDiff) { bestDiff = m; sq = lag; }
  }

  const isLevel = (v, lvl) => Math.abs(v - lvl) <= 3;
  const gLo = D - 4, gHi = L + 4;

  const strict = new Uint8Array(w * h);
  const loose = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!neutral(i)) continue;
      const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
      if (Math.min(r, g, b) >= gLo && Math.max(r, g, b) <= gHi) loose[i] = 1;
      const v = r;
      const other = isLevel(v, L) ? D : isLevel(v, D) ? L : -1;
      if (other < 0) continue;
      if (L === D) { strict[i] = 1; continue; }
      // The positional test. This is the whole idea.
      if (
        (x + sq < w && isLevel(at(x + sq, y), other)) ||
        (x - sq >= 0 && isLevel(at(x - sq, y), other)) ||
        (y + sq < h && isLevel(at(x, y + sq), other)) ||
        (y - sq >= 0 && isLevel(at(x, y - sq), other))
      ) strict[i] = 1;
    }

  // Grown two pixels along the anti-aliased seams between squares, which
  // otherwise stand as one-pixel walls through the background.
  let cand = strict;
  for (let pass = 0; pass < 2; pass++) {
    const grown = cand.slice();
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (cand[i] || !loose[i]) continue;
        if (cand[i - 1] || cand[i + 1] || cand[i - w] || cand[i + w]) grown[i] = 1;
      }
    cand = grown;
  }

  // BACKGROUND IS WHEREVER THE CHECKER IS, reachable from the border or not,
  // and 4.9 is why. Its open-backed hanging bay has checker showing THROUGH it,
  // enclosed by carcass on all four sides; a flood fill from the border cannot
  // reach it and leaves a patch of grey squares hanging in the bay. That patch
  // is exactly where the customer's own wall has to show through.
  //
  // Global is safe precisely BECAUSE the test above is positional. What it does
  // admit is isolated speckle, and speckle is what the size filter removes.
  const bg = cand.slice();
  const label = new Int32Array(w * h);
  const queue = new Int32Array(w * h);
  let next = 0;
  for (let s = 0; s < w * h; s++) {
    if (!bg[s] || label[s]) continue;
    next++;
    let head = 0, tail = 0;
    queue[tail++] = s; label[s] = next;
    let touchesBorder = false;
    while (head < tail) {
      const i = queue[head++];
      const x = i % w, y = (i / w) | 0;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touchesBorder = true;
      if (x > 0 && bg[i - 1] && !label[i - 1]) { label[i - 1] = next; queue[tail++] = i - 1; }
      if (x < w - 1 && bg[i + 1] && !label[i + 1]) { label[i + 1] = next; queue[tail++] = i + 1; }
      if (y > 0 && bg[i - w] && !label[i - w]) { label[i - w] = next; queue[tail++] = i - w; }
      if (y < h - 1 && bg[i + w] && !label[i + w]) { label[i + w] = next; queue[tail++] = i + w; }
    }
    // A region touching the border is background by definition; an enclosed one
    // has to be big enough to be a real opening rather than luck inside a
    // garment's weave.
    if (!touchesBorder && tail < 400) for (let k = 0; k < tail; k++) bg[queue[k]] = 0;
  }

  // --- alpha, and un-matting the silhouette --------------------------------
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = bg[i] ? 0 : 255;

  let edge = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (bg[i]) continue;
      if (bg[i - 1] || bg[i + 1] || bg[i - w] || bg[i + w]) edge[i] = 1;
    }

  for (let pass = 0; pass < 2; pass++) {
    const nextEdge = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (!edge[i]) continue;
        const b = Math.abs(px[i * 4] - L) <= Math.abs(px[i * 4] - D) ? L : D;
        const d = Math.max(
          Math.abs(px[i * 4] - b),
          Math.abs(px[i * 4 + 1] - b),
          Math.abs(px[i * 4 + 2] - b),
        );
        if (d >= T1) continue;
        const a = Math.max(0, Math.min(1, (d - T0) / (T1 - T0)));
        alpha[i] = Math.round(a * 255);
        if (a > 0.02) {
          // obs = a*F + (1-a)*B with B known, so F comes back out exactly.
          for (let c = 0; c < 3; c++) {
            const f = (px[i * 4 + c] - (1 - a) * b) / a;
            px[i * 4 + c] = Math.max(0, Math.min(255, Math.round(f)));
          }
        }
        if (pass === 0)
          for (const j of [i - 1, i + 1, i - w, i + w]) if (!bg[j] && !edge[j]) nextEdge[j] = 1;
      }
    edge = nextEdge;
  }

  for (let i = 0; i < w * h; i++) px[i * 4 + 3] = alpha[i];

  // --- crop, and find the carcass inside it --------------------------------
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (alpha[y * w + x] > 2) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  if (maxX < minX) throw new Error('nothing survived the cut');

  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++)
    px.copy(out, y * cw * 4, ((y + minY) * w + minX) * 4, ((y + minY) * w + minX + cw) * 4);

  // THE CARCASS IS NOT THE BOUNDING BOX, and the difference is what stops the
  // wardrobe floating. Every sticker is STAGED: suitcases and boxes stand on
  // top, shoes and a holdall sit on the floor in front. Map the whole bounding
  // box onto the traced wall and the cabinet lands short of the floor by the
  // height of a pair of shoes, which reads as hovering.
  //
  // FOUND AS THE LARGEST CONNECTED RUN OF BOARD, which is the one description
  // that fits every layout. Row-coverage density was the first attempt and it
  // failed on exactly the thing that makes these cabinets worth rendering: they
  // are open-fronted, so a bay is mostly transparent and a "solid" row never
  // materialises -- 3.0 came back as its left-hand tower alone.
  //
  // Board is bright and neutral; the staging deliberately is not. Cases, boxes,
  // shoes and bags are all tan, brown or charcoal, so they drop out on colour,
  // and the panels-shelves-top-bottom of one cabinet are a single connected
  // white object. White SHIRTS survive the colour test, but they hang inside
  // the carcass and cannot push its box outward.
  const board = new Uint8Array(cw * ch);
  for (let i = 0; i < cw * ch; i++) {
    if (out[i * 4 + 3] < 200) continue;
    const r = out[i * 4], g = out[i * 4 + 1], b = out[i * 4 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    // Bright, and close to neutral. Natural oak would need a wider gate; the
    // supplied set is all Matt Wardrobe White.
    if (mx >= 165 && mx - mn <= 34) board[i] = 1;
  }

  const seen = new Int32Array(cw * ch);
  const q = new Int32Array(cw * ch);
  let bx0 = 0, by0 = 0, bx1 = cw - 1, by1 = ch - 1, best = -1;
  for (let s = 0; s < cw * ch; s++) {
    if (!board[s] || seen[s]) continue;
    let head = 0, tail = 0;
    q[tail++] = s; seen[s] = 1;
    let lx0 = cw, ly0 = ch, lx1 = -1, ly1 = -1;
    while (head < tail) {
      const i = q[head++];
      const x = i % cw, y = (i / cw) | 0;
      if (x < lx0) lx0 = x;
      if (x > lx1) lx1 = x;
      if (y < ly0) ly0 = y;
      if (y > ly1) ly1 = y;
      if (x > 0 && board[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; q[tail++] = i - 1; }
      if (x < cw - 1 && board[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; q[tail++] = i + 1; }
      if (y > 0 && board[i - cw] && !seen[i - cw]) { seen[i - cw] = 1; q[tail++] = i - cw; }
      if (y < ch - 1 && board[i + cw] && !seen[i + cw]) { seen[i + cw] = 1; q[tail++] = i + cw; }
    }
    if (tail > best) { best = tail; bx0 = lx0; by0 = ly0; bx1 = lx1; by1 = ly1; }
  }

  const [cx0, cy0, cx1, cy1] = [bx0, by0, bx1, by1];

  // --- WHERE THE FIXED MODULES ACTUALLY ARE, measured off the artwork -------
  //
  // The slice boundaries were originally derived from the layout table and an
  // assumed reference width, and four of the seven renders disagreed with it.
  // 6.0 was recorded as an 1800 render; its tower measures 20.9% of the
  // carcass, which at a 507mm module puts the real render nearer 2400. The
  // boundary therefore landed 8% too far right and painted the first hanging
  // garments onto the drawer fronts — visible only on the white finish, because
  // white is the only one with a photograph to project.
  //
  // So it is measured. A divider is a narrow vertical strip of board standing
  // PROMINENT above its neighbours — which holds even where a coat hangs across
  // it, and in a tower whose open shelves are full of dark folded clothes.
  // Absolute coverage found neither of those cases.
  // Profiled over the CARCASS's own height only. Taken over the whole file it
  // includes the cases and baskets staged on top and the shoes on the floor,
  // which are neither board nor cabinet, and they move the peaks: 5.0's tower
  // came back at 41% instead of 20%.
  const colBoard = new Float64Array(cw);
  for (let x = 0; x < cw; x++) {
    let n = 0, tot = 0;
    for (let y = cy0; y <= cy1; y++) {
      const i = y * cw + x;
      if (out[i * 4 + 3] < 200) continue;
      tot++;
      const mx = Math.max(out[i * 4], out[i * 4 + 1], out[i * 4 + 2]);
      const mn = Math.min(out[i * 4], out[i * 4 + 1], out[i * 4 + 2]);
      if (mx >= 176 && mx - mn <= 26) n++;
    }
    colBoard[x] = tot ? n / tot : 0;
  }

  /** Divider-like columns within a fraction range of the carcass, in order. */
  const dividersIn = (lo, hi) => {
    const a = Math.round(cx0 + lo * (cx1 - cx0));
    const b = Math.round(cx0 + hi * (cx1 - cx0));
    const nb = Math.max(6, Math.round((cx1 - cx0) * 0.035));
    const hits = [];
    for (let i = Math.max(nb, a); i <= Math.min(cw - nb - 1, b); i++) {
      if (colBoard[i] < 0.55) continue;
      let loMin = 1, hiMin = 1;
      for (let k = 1; k <= nb; k++) {
        loMin = Math.min(loMin, colBoard[i - k]);
        hiMin = Math.min(hiMin, colBoard[i + k]);
      }
      const prom = colBoard[i] - Math.max(loMin, hiMin);
      if (prom < 0.14) continue;
      let isPeak = true;
      for (let k = -nb; k <= nb; k++) if (colBoard[i + k] > colBoard[i] + 1e-9) { isPeak = false; break; }
      if (!isPeak) continue;
      if (hits.length && i - hits[hits.length - 1] < nb) continue;
      hits.push(i);
    }
    return hits.map(i => (i - cx0) / (cx1 - cx0));
  };

  // THE FIRST DIVIDER, NOT THE STRONGEST. A tower sits at the end of the run,
  // so the boundary that closes it is the first one in from that edge —
  // whatever else is further along is a shelf edge or a bay divider standing
  // more prominently. Picking by prominence put 5.0's tower at 41% (a bay
  // divider) instead of 20% (its own).
  const lead = dividersIn(0.12, 0.46);
  const trail = dividersIn(0.54, 0.90);
  const towerLead = lead.length ? lead[0] : null;
  const towerTrail = trail.length ? trail[trail.length - 1] : null;

  // A leading tower sits in the first half; a trailing one in the last.

  return {
    width: cw,
    height: ch,
    data: out,
    sq, L, D,
    towerLead, towerTrail,
    // Normalised, so the renderer needs no pixel arithmetic of its own.
    carcass: {
      x0: cx0 / cw, y0: cy0 / ch,
      x1: (cx1 + 1) / cw, y1: (cy1 + 1) / ch,
    },
  };
}

// --- which sticker is which -----------------------------------------------

// The viewpoint each supplied render was actually drawn at, read off the files.
// 4.9 is the one three-quarter built-in -- its left side panel recedes and its
// top surface shows -- which is also the proof that the render pipeline can
// produce the angled set the other six still need.
const VIEW = {
  '2.9': 'front', '3.0': 'front', '4.0': 'front', '4.9': 'angle',
  '5.0': 'front', '6.0': 'front', '8.0': 'front',
  '7.0L': 'interior', '9.0L': 'interior', '12.0U': 'interior',
};

// --- what goes IN the wardrobe --------------------------------------------
//
// The modelled carcass is what the three timber finishes fall back to, because
// all ten renders are Matt Wardrobe White and no tint invents walnut figure.
// Modelled board is fine; modelled CLOTHING is not -- flat coloured bars at the
// pitch of a coat rail were the loudest synthetic thing in the frame.
//
// wardrobeContents.ts was already built to take photographic cut-outs and had
// simply never been given any. These are them, cropped out of the same stickers
// -- so the model does the structure and the photographs do the surface, which
// is the division of labour that file's own comment says was wanted all along.
// And unlike a recoloured carcass, a photograph of a coat is correct against
// EVERY finish, because a coat does not change colour with the board.
//
// EVERY CROP IS DELIBERATELY OF DARK CLOTHING, and that is the whole reason
// this works where recolouring the board does not. Cutting a cream shirt off a
// white panel is the white-on-white problem that has no solution; cutting a
// charcoal coat off the same panel is a brightness threshold. The staging
// happens to offer both, so the crops take the easy half.
const CONTENT_CROPS = [
  // Three charcoal coats from 3.0's left-hand run, full drop.
  { out: 'hanging-long.png', from: '3.0-white-front.png', x0: 0.270, y0: 0.235, x1: 0.398, y1: 0.578, key: true },
  // 4.0's lower rail -- dark trousers, the short drop of a double-hang.
  { out: 'hanging-short.png', from: '4.0-white-front.png', x0: 0.272, y0: 0.512, x1: 0.338, y1: 0.788, key: true },
  // A folded stack of dark knitwear from 4.0's tower.
  { out: 'stack.png', from: '4.0-white-front.png', x0: 0.124, y0: 0.352, x1: 0.246, y1: 0.397, key: true },
  // These two already sit against the checkerboard rather than against board,
  // so they came out of the main cut already isolated and need no keying.
  { out: 'shoes.png', from: '3.0-white-front.png', x0: 0.325, y0: 0.752, x1: 0.432, y1: 0.828, key: false },
  { out: 'box.png', from: '3.0-white-front.png', x0: 0.296, y0: 0.126, x1: 0.448, y1: 0.196, key: false },
];

/** Crops one object out of a finished cut-out.
 *
 * WHERE IT HAS TO BE KEYED, the background is the carcass's own board: bright,
 * flat and continuous. Removing it by brightness alone would also punch out any
 * highlight ON the garment, so the bright pixels are flood-filled FROM THE CROP
 * BORDER instead -- a lit shoulder is surrounded by cloth and never reached,
 * while the panel is connected to the edge everywhere.
 */
function cropContent(src, spec) {
  const { width: w, height: h, data: px } = src;
  const cx0 = Math.round(spec.x0 * w), cx1 = Math.round(spec.x1 * w);
  const cy0 = Math.round(spec.y0 * h), cy1 = Math.round(spec.y1 * h);
  const cw = cx1 - cx0, ch = cy1 - cy0;
  if (cw < 4 || ch < 4) throw new Error(`degenerate crop for ${spec.out}`);

  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++)
    px.copy(out, y * cw * 4, ((y + cy0) * w + cx0) * 4, ((y + cy0) * w + cx1) * 4);

  if (spec.key) {
    const lumaAt = i => 0.299 * out[i * 4] + 0.587 * out[i * 4 + 1] + 0.114 * out[i * 4 + 2];
    // Measured off the crops rather than guessed: the panel INSIDE a bay is in
    // shade and reads 131-162, while the charcoal garments in front of it read
    // 5-79. The first pass used 168, which sat above the background entirely and
    // keyed nothing, leaving a grey slab behind every coat.
    const BRIGHT = 118;
    const bg = new Uint8Array(cw * ch);
    const st = [];
    for (let x = 0; x < cw; x++) { st.push(x); st.push((ch - 1) * cw + x); }
    for (let y = 0; y < ch; y++) { st.push(y * cw); st.push(y * cw + cw - 1); }
    while (st.length) {
      const i = st.pop();
      if (bg[i]) continue;
      if (out[i * 4 + 3] > 8 && lumaAt(i) < BRIGHT) continue;
      bg[i] = 1;
      const x = i % cw, y = (i / cw) | 0;
      if (x > 0) st.push(i - 1);
      if (x < cw - 1) st.push(i + 1);
      if (y > 0) st.push(i - cw);
      if (y < ch - 1) st.push(i + cw);
    }
    // Feathered over the last few levels rather than cut at one, so a coat's
    // edge keeps its anti-aliasing instead of gaining a jagged outline.
    for (let i = 0; i < cw * ch; i++) {
      if (!bg[i]) continue;
      const l = lumaAt(i);
      const a = Math.max(0, Math.min(1, (BRIGHT + 22 - l) / 22));
      out[i * 4 + 3] = Math.round(out[i * 4 + 3] * a);
    }
  }

  // Trimmed to what actually survived, so the declared width in
  // wardrobeContents.ts describes the OBJECT and not the crop around it.
  let minX = cw, minY = ch, maxX = -1, maxY = -1;
  for (let y = 0; y < ch; y++)
    for (let x = 0; x < cw; x++)
      if (out[(y * cw + x) * 4 + 3] > 6) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  if (maxX < minX) throw new Error(`${spec.out} keyed away to nothing`);

  const tw = maxX - minX + 1, th = maxY - minY + 1;
  const trimmed = Buffer.alloc(tw * th * 4);
  for (let y = 0; y < th; y++)
    out.copy(trimmed, y * tw * 4, ((y + minY) * cw + minX) * 4, ((y + minY) * cw + minX + tw) * 4);

  return { width: tw, height: th, data: trimmed };
}

const files = readdirSync(DIR).filter(f => /^Forma Wardrobe .+ Sticker\.png$/.test(f));
if (!files.length) throw new Error(`no stickers found in ${DIR}`);

const manifest = [];
for (const file of files) {
  const id = file.replace(/^Forma Wardrobe /, '').replace(/ Sticker\.png$/, '');
  const view = VIEW[id] ?? 'front';
  const res = cut(decodePng(readFileSync(join(DIR, file))));
  const name = `${id}-white-${view}.png`;
  writeFileSync(join(DIR, name), encodePng(res.width, res.height, res.data));
  manifest.push({ id, view, file: name, ...res.carcass, w: res.width, h: res.height, towerLead: res.towerLead, towerTrail: res.towerTrail });
  const pct = v => (v * 100).toFixed(1);
  console.log(
    `${id.padEnd(6)} ${view.padEnd(8)} ${res.width}x${res.height}  sq=${res.sq}  ` +
    `carcass ${pct(res.carcass.x0)}..${pct(res.carcass.x1)} x ${pct(res.carcass.y0)}..${pct(res.carcass.y1)}  `,
  );
}

// The contents, cropped out of the cut-outs that were just written.
mkdirSync(CONTENTS, { recursive: true });
for (const spec of CONTENT_CROPS) {
  const src = decodePng(readFileSync(join(DIR, spec.from)));
  const res = cropContent(src, spec);
  writeFileSync(join(CONTENTS, spec.out), encodePng(res.width, res.height, res.data));
  console.log(`  content ${spec.out.padEnd(20)} ${res.width}x${res.height}  from ${spec.from}`);
}

manifest.sort((a, b) => a.id.localeCompare(b.id));

writeFileSync(MANIFEST, `// GENERATED by scripts/cut-wardrobe-stickers.mjs -- do not edit by hand.
//
// Where the CARCASS sits inside each cut-out, as fractions of the file.
//
// Not the same as the file's own bounds, and that difference is what keeps the
// wardrobe standing on the floor. Every sticker is staged: cases and boxes on
// top, shoes and a holdall on the floor in front. The traced quad is the
// CABINET, so the cabinet is what has to land on it -- the props then fall
// outside the trace on their own, which is exactly where they belong.

export interface WardrobeCutout {
  id: string;
  view: 'front' | 'angle' | 'interior';
  file: string;
  /** Pixel size of the cut-out file. */
  w: number;
  h: number;
  /** Where a fixed module ends, as a fraction of the CARCASS (not the file),
   * measured off the artwork. Null where the layout has no module on that side. */
  towerLead: number | null;
  towerTrail: number | null;
  /** The carcass box within the file, 0..1. */
  x0: number; y0: number; x1: number; y1: number;
}

export const WARDROBE_CUTOUTS: WardrobeCutout[] = ${JSON.stringify(
    manifest.map(m => ({ id: m.id, view: m.view, file: m.file, w: m.w, h: m.h, towerLead: m.towerLead, towerTrail: m.towerTrail, x0: +m.x0.toFixed(5), y0: +m.y0.toFixed(5), x1: +m.x1.toFixed(5), y1: +m.y1.toFixed(5) })),
    null,
    2,
  ).replace(/"([a-z0-9]+)":/gi, '$1:')};

export const cutoutFor = (id: string): WardrobeCutout | undefined =>
  WARDROBE_CUTOUTS.find(c => c.id === id);
`);

console.log(`\n${manifest.length} cut, manifest -> ${MANIFEST}`);





