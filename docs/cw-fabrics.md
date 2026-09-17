# Supplied fabric library

Originals: `assets-source/fabrics/cw/`.
Web assets: `public/images/fabrics/cw/`.
Shared catalogue: `src/features/fabrics/`.

The shop cards (also used for homepage purchases) and visualiser read the same
sample names and measured colours. Roller choices run in this order: fabric
type, fabric range, colour. The cart retains the full range and colour name.
No price tables were changed.

## Confirmed mappings

- ATLAS is for roller blinds, confirmed by the owner on 14 September 2026.
- Panorama 5% is roller sunscreen, confirmed by the owner. Its eight colours
  are only offered under Sunscreen.
- Venetians offer UltraSlat only, confirmed by the owner on 17 September 2026.
  Aluminium and Basswood samples and source swatches have been removed. There
  is no material selector. The plantation renderer retains its separate neutral
  wood-grain texture for its existing wood finishes.
- Honeycomb has six named colours in both Blockout and Light Filtering.
  Day & Night uses the corresponding light-filter colour for its upper cells
  and blockout colour for its lower cells. The supplied Sheer Ice sample is
  indexed, but does not create an additional product configuration.
- Roller hardware: White, Black, Cream and Platinum, sampled from the supplied
  bottom-rail colour images. These do not change curtain hardware choices.

## Still requiring supplier information

The five remaining ATLAS ranges (Essence, Montecarlo, Symphony, Urbania, Verve)
are currently selectable with the existing blockout, light-filter and dual
configurations. This availability is provisional: the supplied folder names
do not establish which opacity each range supports. Confirm this with the
supplier and update `fabricCollections` before treating that mapping as an
approved manufacturing specification. For dual rollers the selection colours
the existing two-layer preview and textures the front blockout layer; the back
layer retains its existing sunscreen weave.

No named curtain fabric swatches were supplied, so curtain colours and their
approved renderer remain in place. Room photography and installation diagrams
are not fabric swatches and have not been presented as purchasable colours.

## Preparation and verification

From the project directory:

```text
node tools/prepare-cw-fabrics.mjs
node tools/verify-cw-fabrics.mjs
```

Preparation uses the installed headless Edge browser to produce 128px swatches,
512px-or-smaller rendering textures and neutral weave overlays. Colour is the
median of the central sample area, excluding borders. Files retain the supplied
spelling. Source paths are recorded for every sample.

Verification requires the Klay development server on port 5173 (or `CW_URL`).
It checks exact asset paths, 172 product configurations, unchanged roller prices,
cart labels, independent windows, desktop/mobile layout, homepage options,
visualiser texture loading and fallback when a supplied texture cannot load.

The existing asset-path checker also flags the curtain renderer's
`endsWith('/curtain-shop-room.webp')` suffix as a missing root asset. This is a
pre-existing false positive; the room image is under `images/visualiser/`.
