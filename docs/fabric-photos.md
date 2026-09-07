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

## The awning, and the numbers it was cut with

A folding arm awning gets `--awning`, a third geometry. It is not a blind in a
recess and not a curtain on a wall: a sheet of acrylic held out over a garden on
two elbowed arms, photographed from underneath, crossing the frame corner to
corner with sky behind it.

Two things make it cheap anyway. **The sky is blue** — 0.24-0.36 saturation
against the canopy's 0.10-0.14, the widest gap between a product and its
background of any shot here — so a fill that refuses saturation finds the
silhouette. And **the arms are darker than the cloth they hold up**, 151-192
against 205-222, because an arm is in its own shadow under a lit sheet. So the
fill splits by brightness at 198: the dark half is metalwork and takes the
cassette colour, the bright half is cloth and takes the fabric colour. No arm is
traced by hand.

```
node tools/cut-fabric-mask.mjs public/images/fabrics/folding-arm-awnings.webp folding-arm-awnings --awning \
  --box=0.013,0.62,0.05,0.9333 \
  --keep=0.045,0.010,0.215,0.010,0.340,0.130,0.450,0.170,0.560,0.205,0.660,0.245,0.780,0.290,0.878,0.333,0.908,0.348,0.908,0.430,0.896,0.470,0.870,0.505,0.845,0.548,0.778,0.578,0.700,0.600,0.651,0.600,0.640,0.548,0.556,0.548,0.444,0.498,0.333,0.418,0.045,0.200 \
  --metal=0.0611,0.0365,0.0667,0.0208,0.1611,0.0169,0.1889,0.0365,0.1978,0.0755,0.1889,0.1198,0.1611,0.1380,0.0833,0.1406,0.0611,0.1198 \
  --metal=0.1022,0.1302,0.1689,0.1302,0.1689,0.1979,0.1022,0.1979 \
  --metal=0.8833,0.3490,0.9070,0.3620,0.9070,0.3958,0.8911,0.4036,0.8800,0.3802 \
  --cloth=0.6500,0.5391,0.8900,0.4831,0.8930,0.4896,0.6500,0.5950
```

- `--keep` is the silhouette, and it is the one number that cannot be skipped. A
  box is enough to bound an upright product; an awning is diagonal, so any
  rectangle around it also contains the house wall below its left end — cream,
  unsaturated, connected to the cassette — and the fill walks down the wall and
  out along the bottom into the garden. It also holds the fill off the **hazy sky
  near the horizon**, which is pale and unsaturated and would otherwise be
  admitted as cloth.
- `--metal` are the cassette, its wall bracket and the front-bar end cap: bright
  aluminium the brightness split would hand to the fabric.
- `--cloth` is the valance hanging off the front bar, which is in shade and reads
  at arm brightness while being cloth.

**Cutting it right is only half of it.** Multiplying a colour through this mask
lands the awning in the right place and takes all the life out of it: the cloth
photographs across 208-229, Navy takes it to 46-50, and a four-level range reads
as a navy shape pasted onto a photograph with the arms swallowed into it. The
awning carries `sheen: 0.7` and `spec: 0.7` for that reason — higher than
anything else here, because it has more to lose. See the notes on `SHEEN` and
`SPECULAR` in tools/generate-fabric-shots.mjs.

Two edge rules are in the branch rather than the arguments, and both exist for
the same reason a mask cannot be judged on White. Gaps in the fill are **closed
at radius 8 then intersected with `--keep`** — the near arm is a lit rail whose
own edge blends toward blue, crosses the saturation bound and drops out, leaving
a sixteen-pixel band of undyed cream corner to corner: invisible on Natural, a
bright stripe across a Navy awning. And the soft fringe goes on the **silhouette
only, never on the seam between cloth and metal** — two masks partition one
object here, and a fringe on both sides of their shared border paints it 47%
fabric plus 47% cassette over undyed cream, a pale seam down every arm.

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
