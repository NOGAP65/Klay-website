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
