# Shop product photos — September 2026

Nineteen generated product images and four supporting bathroom/reflection assets cover nine product families. Each image is a 1024 × 1024 WebP. Colour variants are applied at runtime; there are no generated images per colour.

| Product | Base images |
| --- | --- |
| Honeycomb | Blockout and Day & Night in the same room |
| Roller shutters | Exterior window installation |
| Zip guide systems | Floor-to-beam mesh screen across an alfresco opening |
| Wardrobes | Forma 1, Forma 2, Forma 3 |
| Shelving | Linen 1, Linen 2, Linen 5, Linen Broom |
| Fixed frameless showerscreen | Clip fixed and Channel fixed, plus their shared empty bathroom |
| Radius corner fixed frameless showerscreen | Clear and Narrow-reeded glass, each in Clip fixed and Channel fixed |
| Semi-frameless (Front only) showerscreen | Front-only photo and matching empty alcove |
| Semi frameless (Front and Return) showerscreen | Corner enclosure photo and matching empty bathroom |

The images live in `public/images/shop/`. Asset paths and generation prompts/briefs are recorded in `shop-photo-prompts.json`. Original generated PNGs remain in the local Codex generated-images directory; only compressed production assets are shipped.

Both semi-frameless previews use original photos made with the built-in image tool, guided by Stegbar's [Front Only](https://www.stegbar.com.au/products/front-only-screen) and [Front and Return](https://www.stegbar.com.au/products/front-and-return-screen) pages. Their height is 1950mm and their front widths are 800, 850, 900, 1050, 1200 and 1350mm. The return depths paired with those widths are respectively 850, 890, 910, 1010, 1010 and 1010mm. Only Matt Black and Bright Silver are offered, under Hardware colour. Clear glass is fixed; there is no clip/channel selector on a framed product. Both open at 1050mm, the listed size closest to the user's requested approximately 1100mm default. The fixed and radius screens open at 1100mm and keep their existing 2053mm height. All four shower product names end with showerscreen and all four use the Hardware colour label.

`SemiScreenPhotoLayers.tsx` combines the empty bathroom, photographed metal and a shared neutral reflection plate. The corrected images contain no reflected trees, greenery or window-shaped scenery. Glass reflections are blended independently of hardware tint; only metal receives the finish change. Width changes redraw immediately, preserving door width, knob/pivot size and jamb thickness. Continuous top and bottom rails stay straight; the return follows its paired depth. The front-only tiled jamb moves with the opening without scaling the bathroom textures. Colour changes use the existing 320ms transition and respect reduced motion. New images replace the earlier unshipped tree-reflection drafts; no obsolete drafts are kept in public assets.

Wardrobe and shelving layouts were checked against the existing visualiser. Forma 1 has two side-by-side rails and a short support; Forma 2 has a six-compartment shelf tower; Forma 3 has four drawers and three open compartments. Linen layouts have four shelves and respectively zero, one, or two front posts. Linen Broom has one front post and an open right-hand broom bay.

`shopPhotos.ts` binds each existing configuration ID to a photo and traced material regions. `ShopPhotoLayers.tsx` applies the same board decor textures used by the visualiser, orienting grain along the boards and retaining the photograph's illumination. Hanging rails and drawer pulls have separate metal masks. Honeycomb pleats and shutter slats retain local contrast through colour curves; Day & Night has separate transmissive and opaque regions. Zip mesh retains its view through to the garden and outdoor area.

Model images are decoded before changing the matching material masks, preventing a new layout's texture from appearing on the previous image. Wardrobe and shelving widths use the visualizer's `columnsFor` measurements, including fixed 507mm towers, shared dividers and evenly positioned shelf supports. Only the horizontal spans resize. The shop preview height is fixed at 2000mm, with the same camera scale, top and floor position across every layout and width. A fixed 1280 × 1024 frame prevents selecting a width from changing the image height or moving the controls. Photo crops and material masks move together, while grain keeps its physical scale. Existing configuration choices and visualizer product specifications are unchanged.

Joinery width and finish selections redraw immediately, with no interpolation or texture fade. Colour changes on honeycomb, roller shutters, zip mesh, shower fittings and the awning's fabric and cassette ease over 320ms. Rapid colour changes start from the currently visible colour, and reduced-motion preferences disable the transitions. Curtain, roller blind, Venetian and plantation previews retain their existing treatment. Flyscreens are excluded.

Fixed frameless showerscreen has separate clip and channel photos, guided by Stegbar's [Clip Fixed Panel](https://www.stegbar.com.au/products/clip-fixed-panel) and [Channel Fixed Panel](https://www.stegbar.com.au/products/channel-fixed-panel) galleries. These are original generated images, produced with the built-in image tool. The existing configuration lists are unchanged: clip/channel mounting, their seven/six finishes and ten widths, with the existing 2053mm height. The catalogue name and enquiry link now say Fixed frameless showerscreen.

Radius corner fixed frameless showerscreen follows immediately in the catalogue, with Glass type first (Clear or Narrow-reeded), then the same Location, Fixed, Hardware colour and Dimensions controls. Four original generated edits retain the matching bathroom, with the free upper corner rounded and narrow vertical fluting on the reeded pair. References are Stegbar's [Radius Corner Clip Fixed](https://www.stegbar.com.au/products/radius-corner-clip-fixed-1) and [Radius Corner Channel Fixed](https://www.stegbar.com.au/products/radius-corner-channel-fixed-1). Those DIY listings show reeded glass; Clear is informed by the broader [custom frameless range](https://www.stegbar.com.au/products/frameless-shower-screens). Klay's existing sizes and finish choices are retained at the user's request, rather than adopting the DIY listings' stock-size limits or extra fixing-side selector. Glass type is included in quote options and cart identity so clear and reeded selections stay distinct.

`ShowerPhotoLayers.tsx` places the photographed glass over a matching empty bathroom. Width changes crop the glass in place and move its free edge immediately. Radius panels keep the rounded corner's size and shape, and reeding keeps its spacing. The floor clips keep their size and end offsets; wall clips stay anchored. The bathroom and shower fittings never stretch. Only the screen's traced clips or channels are recoloured, retaining photographed highlights and contact shadows; glass is not tinted. Images and the background are decoded together. The old static shower photo was removed.

Shower regression check: `node tools/verify-shower-photo.mjs` covers all four shower products, the two frameless mountings, the twelve semi-frameless sizes and defaults, Hardware colour labels, paired return depths, and, all 60 glass/mounting/width combinations, the existing finish choices and dependent-finish fallback, stable height and wall anchoring, rounded corners, field order, and distinct glass choices in quote/cart lines.

The room above and below the joinery uses one continuous opening region, independent of tower and support boundaries, so those boundaries do not cut through daylight or floorboards. The zip-screen window shot was replaced with an alfresco installation photograph and its mesh mask retraced; the superseded image was removed.

Width regression check: `node tools/verify-shop-widths.mjs` covers every available joinery width, stable height and frame, fixed towers, visualizer support positions, complete crop coverage and consistent grain scale.

The replaced product photos, old wardrobe category/range images, superseded fabric shots and zip masks were deleted. All active references now point to the new photos; older dated asset inventories remain historical records.

Validation: `node tools/verify-shop-photos.mjs`, `node tools/verify-fabric-shots.mjs`, `node tools/verify-asset-paths.mjs`, `node tools/verify-awning-colour.mjs`, TypeScript and the production build. Browser review covers both honeycomb types, light/dark exterior finishes, all seven joinery layouts, wood finishes and metal finishes.
