# Shop product photos — September 2026

Eleven generated base images cover the five remaining product families. Each image is a 1024 × 1024 WebP. Colour variants are applied at runtime; there are no generated images per colour.

| Product | Base images |
| --- | --- |
| Honeycomb | Blockout and Day & Night in the same room |
| Roller shutters | Exterior window installation |
| Zip guide systems | Exterior mesh screen over a window |
| Wardrobes | Forma 1, Forma 2, Forma 3 |
| Shelving | Linen 1, Linen 2, Linen 5, Linen Broom |

The images live in `public/images/shop/`. Asset paths and generation prompts/briefs are recorded in `shop-photo-prompts.json`. Original generated PNGs remain in the local Codex generated-images directory; only compressed production assets are shipped.

Wardrobe and shelving layouts were checked against the existing visualiser. Forma 1 has two side-by-side rails and a short support; Forma 2 has a six-compartment shelf tower; Forma 3 has four drawers and three open compartments. Linen layouts have four shelves and respectively zero, one, or two front posts. Linen Broom has one front post and an open right-hand broom bay.

`shopPhotos.ts` binds each existing configuration ID to a photo and traced material regions. `ShopPhotoLayers.tsx` applies the same board decor textures used by the visualiser, orienting grain along the boards and retaining the photograph's illumination. Hanging rails and drawer pulls have separate metal masks. Honeycomb pleats and shutter slats retain local contrast through colour curves; Day & Night has separate transmissive and opaque regions. Zip mesh retains its view through to the glass and interior.

Model images are decoded before changing the matching material masks, preventing a new layout's texture from appearing on the previous image. Square framing keeps image and masks aligned at all screen widths. Product configurations and the completed curtain, roller blind, Venetian, plantation and awning previews remain unchanged. Flyscreens and shower screens are excluded.

The replaced product photos, old wardrobe category/range images, superseded fabric shots and zip masks were deleted. All active references now point to the new photos; older dated asset inventories remain historical records.

Validation: `node tools/verify-shop-photos.mjs`, `node tools/verify-fabric-shots.mjs`, `node tools/verify-asset-paths.mjs`, `node tools/verify-awning-colour.mjs`, TypeScript and the production build. Browser review covers both honeycomb types, light/dark exterior finishes, all seven joinery layouts, wood finishes and metal finishes.
