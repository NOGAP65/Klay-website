# Shop product photos — September 2026

Thirteen generated product images and one shared bathroom background cover six product families. Each image is a 1024 × 1024 WebP. Colour variants are applied at runtime; there are no generated images per colour.

| Product | Base images |
| --- | --- |
| Honeycomb | Blockout and Day & Night in the same room |
| Roller shutters | Exterior window installation |
| Zip guide systems | Floor-to-beam mesh screen across an alfresco opening |
| Wardrobes | Forma 1, Forma 2, Forma 3 |
| Shelving | Linen 1, Linen 2, Linen 5, Linen Broom |
| Fixed Panel Shower Screen | Clip fixed and Channel fixed, plus their shared empty bathroom |

The images live in `public/images/shop/`. Asset paths and generation prompts/briefs are recorded in `shop-photo-prompts.json`. Original generated PNGs remain in the local Codex generated-images directory; only compressed production assets are shipped.

Wardrobe and shelving layouts were checked against the existing visualiser. Forma 1 has two side-by-side rails and a short support; Forma 2 has a six-compartment shelf tower; Forma 3 has four drawers and three open compartments. Linen layouts have four shelves and respectively zero, one, or two front posts. Linen Broom has one front post and an open right-hand broom bay.

`shopPhotos.ts` binds each existing configuration ID to a photo and traced material regions. `ShopPhotoLayers.tsx` applies the same board decor textures used by the visualiser, orienting grain along the boards and retaining the photograph's illumination. Hanging rails and drawer pulls have separate metal masks. Honeycomb pleats and shutter slats retain local contrast through colour curves; Day & Night has separate transmissive and opaque regions. Zip mesh retains its view through to the garden and outdoor area.

Model images are decoded before changing the matching material masks, preventing a new layout's texture from appearing on the previous image. Wardrobe and shelving widths use the visualizer's `columnsFor` measurements, including fixed 507mm towers, shared dividers and evenly positioned shelf supports. Only the horizontal spans resize. The shop preview height is fixed at 2000mm, with the same camera scale, top and floor position across every layout and width. A fixed 1280 × 1024 frame prevents selecting a width from changing the image height or moving the controls. Photo crops and material masks move together, while grain keeps its physical scale. Existing configuration choices and visualizer product specifications are unchanged.

Joinery width and finish selections redraw immediately, with no interpolation or texture fade. Colour changes on honeycomb, roller shutters, zip mesh, shower fittings and the awning's fabric and cassette ease over 320ms. Rapid colour changes start from the currently visible colour, and reduced-motion preferences disable the transitions. Curtain, roller blind, Venetian and plantation previews retain their existing treatment. Flyscreens are excluded.

The Fixed Panel Shower Screen has separate clip and channel photos, guided by Stegbar's [Clip Fixed Panel](https://www.stegbar.com.au/products/clip-fixed-panel) and [Channel Fixed Panel](https://www.stegbar.com.au/products/channel-fixed-panel) galleries. These are original generated images, produced with the built-in image tool. The existing configuration lists are unchanged: clip/channel mounting, their seven/six finishes and ten widths, with the existing 2053mm height. The catalogue name and enquiry link now say Fixed Panel Shower Screen.

`ShowerPhotoLayers.tsx` places the photographed glass over a matching empty bathroom. Width changes crop the glass in place and move its free edge immediately. The floor clips keep their size and end offsets; wall clips stay anchored. The bathroom and shower fittings never stretch. Only the screen's traced clips or channels are recoloured, retaining photographed highlights and contact shadows; the clear glass is not tinted. Images and the background are decoded together. The old static shower photo was removed.

Shower regression check: `node tools/verify-shower-photo.mjs` covers both mountings, all 20 mounting/width combinations, all 13 mounting/finish choices, the existing dependent-finish fallback, and stable height and wall anchoring.

The room above and below the joinery uses one continuous opening region, independent of tower and support boundaries, so those boundaries do not cut through daylight or floorboards. The zip-screen window shot was replaced with an alfresco installation photograph and its mesh mask retraced; the superseded image was removed.

Width regression check: `node tools/verify-shop-widths.mjs` covers every available joinery width, stable height and frame, fixed towers, visualizer support positions, complete crop coverage and consistent grain scale.

The replaced product photos, old wardrobe category/range images, superseded fabric shots and zip masks were deleted. All active references now point to the new photos; older dated asset inventories remain historical records.

Validation: `node tools/verify-shop-photos.mjs`, `node tools/verify-fabric-shots.mjs`, `node tools/verify-asset-paths.mjs`, `node tools/verify-awning-colour.mjs`, TypeScript and the production build. Browser review covers both honeycomb types, light/dark exterior finishes, all seven joinery layouts, wood finishes and metal finishes.
