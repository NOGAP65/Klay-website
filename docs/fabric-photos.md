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

## The curtains, and the numbers they were cut with

The same idea, one more rectangle, and the same warning: read by eye, not
recoverable from the file, so re-cutting without them undoes all of it.

```
node tools/cut-fabric-mask.mjs public/images/fabrics/curtains-blockout.webp curtains --curtain \
  --box=0.0589,0.79,0.065,0.935 \
  --glass=0.1044,0.79,0.4844,0.52 \
  --lit=0.1044,0.79,0.52,0.5422 \
  --front=0.6422,0.79,0.0644,0.0956 \
  --track=0.0522,0.0589,0.0644,0.9367
```

- `--glass` is the window between the two panels. The flood fill used to find it
  by brightness and could not: the leading edge of the right-hand panel faces the
  window and reads 243-255 against a shaded fold's 155-195, so the bound that
  kept daylight out kept that edge out too and left a ragged bright strip down
  the middle of the picture.
- `--lit` is that edge, handed back. Inside it the brightness test is not asked —
  a structural claim, like the roller's bridge up to the headrail.
- `--front` is the sofa back crossing the bottom-left corner. Cream sofa, cream
  curtain: no colour test separates them and the fill walks from one to the
  other.
- `--track` is the ceiling track, which is what the hardware colour paints. It is
  seven pixels and that is all this photograph holds — the curtain is
  ceiling-mounted, so the track is most of the way into the recess. The box's top
  starts where the track ends, so the dye stops at the heading and no colour
  spills onto the ceiling above it.

Every given rectangle is feathered by eight pixels where it meets the cloth. A
hand-typed edge is perfectly straight and perfectly hard, and against a sheer
that reads as a cut-out rather than a gap — the fill's own boundary has always
been soft, and a given one has to be too.

Both curtain fabrics share this mask and this track; only `dye` differs, and the
sheer's is 0.62 rather than the 0.38 the visualiser uses for the same cloth. See
the note on `DYE_STRENGTH` in tools/generate-fabric-shots.mjs for why a number
read off a flat swatch is the wrong number for a photograph of a bright window,
and the note on `SHEEN` beside it for why the card paints the cloth's own
modelling back over a dark dye.

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
