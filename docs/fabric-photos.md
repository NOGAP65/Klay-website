# Fabric photograph masters

The full-resolution originals the shop cards' photographs are generated from.
One per product and fabric type.

**These do not ship.** `assets-source/` is outside `public/`, so nothing here is
bundled or served — which is the point: the masters are 1.6–2.3 MB each and the
files a customer loads are 80–140 KB. Anything a visitor needs lives in
`public/images/fabrics/`.

## Making a shot from a master

```
node tools/cut-fabric-mask.mjs assets-source/fabric-photos/<master>.png <product-id>
npm run gen:fabric-shots
npm run check:fabric-shots
```

The cutter writes the cloth and hardware masks into `public/images/fabrics/` and
an overlay into `docs/fabric-overlays/` — **look at that overlay before trusting
the cut**. A mask cannot be judged against the photograph it came from: an edge
that is bone-against-bone and invisible on White is a bright fringe on Black.

Masks are per product, not per fabric — the fabrics of one product are the same
window in the same room, so the blind occupies the same pixels in all of them.

## The louvred two, and the numbers they were cut with

A venetian and a plantation shutter go through `--slats`, which takes three
kinds of rectangle in fractions of the frame: `--box` is the whole unit, frame
to frame; `--glass` is each opening the blind covers, and only there does the
slat-versus-daylight test get asked; `--front` is anything standing between the
camera and the blind. Everything in the box that is not glass is product — which
is how the frame, the stiles, the rails and the tilt rods take colour, none of
which can be found by looking at their pixels.

**These numbers are read off the photograph by eye and cannot be recovered from
it**, so they live here. Re-cutting either mask without them silently produces
the old louvres-only cut.

```
node tools/cut-fabric-mask.mjs public/images/fabrics/plantation-shutters.webp plantation-shutters --slats \
  --box=0.11,0.6467,0.1933,0.84 \
  --glass=0.1456,0.6067,0.2278,0.3522 --glass=0.1456,0.6067,0.36,0.4878 \
  --glass=0.1456,0.6067,0.5433,0.6711 --glass=0.1456,0.6067,0.68,0.8044

node tools/cut-fabric-mask.mjs public/images/fabrics/venetian-blinds.webp venetian-blinds --slats \
  --box=0.0911,0.6978,0.1689,0.8289 \
  --glass=0.1189,0.6622,0.1711,0.8267 \
  --front=0.6111,0.6444,0.8067,0.8311 --front=0.6444,0.7111,0.7833,0.8311
```

Four openings for a two-panel shutter rather than two, because the tilt rod
stands in front of the view and splits its panel: given the panel whole, the rod
would be daylight and lose its colour. The venetian's two `--front` rectangles
are the lamp shade crossing the bottom corner, stepped to follow the dome —
without them the bottom bar paints a charcoal band across the lamp.

## What the photographs have to do

- **Off-white cloth, never pure white and never blown out.** Colour is applied by
  multiplying, which darkens but cannot lighten: a beige base can never become
  white, and a blind blown out against a white wall gives the mask no edge.
- **Fully lowered, covering the window.** The mask is the blind's own shape.
- **Clear space on all four sides.** The card crops 3:4 on a desktop and 4:3 on a
  phone out of the same file.
- **One room per product.** Every fabric of a product is an *edit* of the first
  photograph, not a fresh generation — four separately generated kitchens would
  mean choosing "sunscreen" appears to move the customer to a different house.

A product with only one photograph has no fabric type; name that file for the
product alone (`venetian-blinds.png`) and the generator records it with a null
fabric.
