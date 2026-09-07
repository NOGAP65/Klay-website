# Generating a product photograph

Prompts for producing the shop-card photographs, and the constraints they exist
to satisfy. Every rule below was paid for by a mask that came out wrong — see
`docs/fabric-photos.md` for the cutting side of it.

## Where each product actually goes

Worth stating, because two of these are easy to get backwards and a wrongly
mounted product is not a photograph you can fix later.

| Product | Mounted | Seen from |
|---|---|---|
| Honeycomb blinds | **Inside**, in the window reveal | Inside the room |
| Zip guide systems | **Outside**, in side tracks over an opening | Outside, from the alfresco side |
| Roller shutters | **Outside**, on the external wall face | Outside |

A honeycomb is an **indoor** blind. It is a cellular fabric that traps air in
its pleats, and it does that inside the reveal against the glass — it is the
insulating blind, not a weather product, and it has no outdoor version. The
catalogue already groups it Indoor.

Zip screens and roller shutters are both **exterior**. A zip screen is mesh in
tracks that zip into side channels so wind cannot lift it; a roller shutter is
interlocking aluminium slats in guides with a headbox, for security, insulation
and total darkness. Both are fitted to the outside of the opening.

## What every shot has to do

These are not stylistic preferences. Each one is something the dyeing pipeline
needs or the cutter cannot recover from.

1. **Square, 1:1, and large** — 1500×1500 or more. The card frame is 1:1 and
   crops with `cover`, so a landscape shot loses the sides. `tools/square-shot.mjs`
   can rescue one only when the edge it extends is a plain surface.
2. **Camera perpendicular, dead straight-on.** No angle, no perspective. The
   folding-arm awning is oblique and cost an entire custom cutter with
   hand-read polygons; a straight-on product is a rectangle anyone can cut.
3. **Fully closed, covering the whole opening.** The mask is the product's own
   shape. A half-raised blind gives half a product.
4. **Clear space on all four sides.** The card crops, and a product touching the
   frame edge has nowhere to go.
5. **Nothing in front of the product.** No plant fronds, lamp shades, sofa backs
   or furniture overlapping it anywhere. A cream lamp in front of cream cloth
   cannot be separated by any colour test — it has to be excluded by a
   hand-typed rectangle, and every one of those is a number nobody can re-derive.
6. **Fabric off-white or light neutral — never pure white, never blown out.**
   Colour is applied by multiplying, which darkens but cannot lighten: a pure
   white base can take a colour, but a blown-out one has no detail left to take
   it, and a beige base can never become white.
7. **The product must differ in tone from the wall behind it.** A white frame in
   shadow and a warm wall in daylight measure the same, and no threshold
   separates them.
8. **Even, soft light across the product.** Hard blown highlights read as holes
   to the cutter and as flat white to the customer.
9. **Hardware clearly visible and a different tone from the cloth** — headbox,
   side tracks, bottom bar. It is cut separately so the hardware colour can
   paint it, which needs it to be distinguishable.
10. **One room per product.** Every fabric of a product is an edit of the same
    photograph, or choosing a fabric appears to move the customer house.

## The prompts

### Honeycomb blinds — interior, TWO shots

Honeycomb is sold in two fabrics, so it needs two photographs: `blockout` and
`daynight`. They share one mask, which means **the second must be an edit of the
first, not a fresh generation** — same room, same window, same camera, same
light, same framing to the pixel. Only the blind changes. Generate the blockout
first, get it right, then ask for the edit.

**1 — Blockout**

> Photorealistic interior photograph of a contemporary Australian living room,
> square 1:1 composition, camera perfectly straight-on and perpendicular to a
> single large window — no angle, no perspective distortion, the window frame
> reading as a true rectangle.
>
> A honeycomb cellular blind is fitted inside the window reveal and is FULLY
> LOWERED, covering the entire glass from the head down to the sill. Its fabric
> is a plain oatmeal off-white — clearly light, but not pure white and not blown
> out anywhere. The horizontal cellular pleats are crisp and evenly spaced across
> the whole drop, with the honeycomb cell structure just readable at the edges. A
> slim white headrail sits at the top and a matching slim bottom rail at the sill.
> The fabric is opaque: no view through it, no bright glow, only a soft even
> luminance across the cloth.
>
> The wall around the window is warm plaster, noticeably warmer and darker than
> the blind fabric so the blind's edges read clearly against it. The window is
> centred with generous clear space on all four sides.
>
> Nothing overlaps or stands in front of the blind — no plants, no lamps, no
> curtains beside it, no furniture crossing the window. Any furniture is low and
> well clear, in the lower corners only.
>
> Soft, even, diffuse daylight. No part of the fabric is clipped to pure white.
> Warm neutral palette, oak floor, off-white walls. No people, no text, no logos,
> no watermark.

**2 — Day & Night** (run as an edit of image 1)

> Keep this photograph exactly as it is — same room, same window, same camera
> position, same framing, same lighting, same furniture, same wall. Change only
> the blind.
>
> Make it a DAY & NIGHT honeycomb: one headrail carrying two cellular fabrics,
> still FULLY LOWERED and still covering the entire glass. The upper half of the
> drop is a light-filtering cell — the same oatmeal off-white, but translucent, so
> daylight glows softly through it. The lower half is the blockout cell, the same
> colour but opaque and very slightly deeper in tone. A slim horizontal
> intermediate rail separates the two, matching the headrail and bottom rail.
>
> Both halves keep the crisp evenly spaced horizontal pleats. The outline of the
> blind, the window frame and every edge stay in exactly the same place as the
> original. No part of the fabric is clipped to pure white, and no view through
> the glass is visible.

The intermediate rail is what makes it read as a day-and-night rather than as a
badly lit blockout, so insist on it. If the model moves the window or changes the
crop, throw the edit away and try again — a shifted frame means two masks, and
the pipeline only carries one per product.

### Zip guide systems — exterior

> Photorealistic exterior photograph of a contemporary Australian alfresco area,
> square 1:1 composition, camera perfectly straight-on and perpendicular to the
> opening — no angle, no perspective distortion.
>
> An outdoor zip-guide screen is FULLY LOWERED across a wide rectangular
> opening. Slim aluminium side tracks run down both edges and are clearly
> visible for their whole length, with a matching rectangular headbox directly
> above. The mesh is a plain, evenly woven sunscreen fabric in a neutral oatmeal
> — light but not white — and the garden beyond is visible through it, softened
> but readable: mown lawn, a clipped hedge, one tree, open sky above the hedge.
>
> The screen is centred, and the whole of it — both side tracks and the full
> headbox — sits inside the frame with a comfortable margin on all four sides.
>
> Nothing stands in front of the screen: no furniture, plants, posts or beams
> overlapping it at any point. Keep the foreground uncluttered and low.
>
> Bright, even daylight. The mesh is lit evenly with no hotspot and no blown
> highlight. Warm neutral palette, limestone paving. No people, no text, no
> logos, no watermark.

### Roller shutters — exterior

> Photorealistic exterior photograph of a contemporary Australian home, square
> 1:1 composition, camera perfectly straight-on and perpendicular to the wall —
> no angle, no perspective distortion.
>
> An aluminium roller shutter is mounted on the OUTSIDE face of the wall over a
> large window and is FULLY LOWERED, the slats covering the entire opening from
> the headbox down to the sill. The horizontal interlocking slats are crisp and
> evenly spaced with visible joint lines, in a plain off-white stone aluminium —
> clearly not pure white and not blown out. A rectangular headbox sits directly
> above the slats and slim vertical side guides run down both edges; headbox and
> guides are fully visible and slightly cooler in tone than the slats.
>
> The surrounding rendered wall is a warm off-white, distinctly different in tone
> from the shutter so its edges read clearly against it. The shutter is centred
> with generous clear space on all four sides.
>
> Nothing stands in front of the shutter — no plants, furniture, downpipes or
> beams crossing it. Keep the foreground clear.
>
> Even, soft daylight with no hard shadow falling across the shutter face. Warm
> neutral palette. No people, no text, no logos, no watermark.

## After the image comes back

Check it against the ten rules above before doing anything else — a shot that
fails one of them costs more to work around than to regenerate. Then:

```
# square it only if it did not come back 1:1, and only into a plain edge
node tools/square-shot.mjs public/images/fabrics/<id>.webp --top=N

node tools/cut-fabric-mask.mjs public/images/fabrics/<id>.webp <id> --panel \
  --cloth=<x1,y1,x2,y2,...>

npm run gen:fabric-shots
npm run check:fabric-shots
```

A straight-on product in a rectangle is a `--panel` cut: four corners read off
the photograph, no colour test, done in a minute. That is the whole reason rule
2 is worth insisting on.
