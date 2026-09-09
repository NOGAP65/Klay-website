# Shop product photos — September 2026

Twenty-six generated product images and four supporting bathroom/reflection assets cover sixteen product families. The two wall-mirror SKUs share one image; the cabinet mirrors share one further image across their three shapes. Each image is a 1024 × 1024 WebP. Colour variants are applied at runtime; there are no generated images per colour. Eight sourced finish samples for the sliding doors are stored separately in `public/images/shop/finishes/`.

| Product | Base images |
| --- | --- |
| Honeycomb | Blockout and Day & Night in the same room |
| Roller shutters | Exterior window installation |
| Pleated flyscreens | One patio-doorway photo with Single/Double closing bars and four frame finishes |
| Zip guide systems | Floor-to-beam mesh screen across an alfresco opening |
| Wardrobes | Forma 1, Forma 2, Forma 3 |
| Walk in wardrobes | Forma 4 (LS01, L-shaped) and Forma 5 (US01, U-shaped) |
| Shelving | Linen 1, Linen 2, Linen 5, Linen Broom |
| Framed Sliding Wardrobe Doors | One flat-panel sliding wardrobe photo, with dynamic Surf/mirror layouts and sizes |
| Shaker Sliding Wardrobe Doors | One recessed-panel sliding wardrobe photo, with dynamic timber, mirror, hardware and size options |
| Fixed frameless showerscreen | Clip fixed and Channel fixed, plus their shared empty bathroom |
| Radius corner fixed frameless showerscreen | Clear and Narrow-reeded glass, each in Clip fixed and Channel fixed |
| Semi-frameless (Front only) showerscreen | Front-only photo and matching empty alcove |
| Semi frameless (Front and Return) showerscreen | Corner enclosure photo and matching empty bathroom |
| Mirrors Frameless / Mirrors Framed | One shared Gothic bathroom photo, with dynamic outlines and frame finishes |
| Mirrors with Cabinets | One photograph with the mirror door open at an angle, revealing two shelves |

The cabinet preview uses a shared physical height scale for the box and mirror. Round's 600mm face extends beyond the 530mm cabinet, and its curved backing meets both photographed hinges. Gothic and Pill meet the same fixed hinge positions. Shape changes redraw immediately, retaining the photographic shelves, quiet reflection and soft cabinet contact shadow.

The images live in `public/images/shop/`. Asset paths and generation prompts/briefs are recorded in `shop-photo-prompts.json`. Original generated PNGs remain in the local Codex generated-images directory; only compressed production assets are shipped.

Sliding door names, materials, dimensions, source precedence and preview behaviour are documented in [sliding-doors.md](sliding-doors.md). The user-supplied Signature PDF takes precedence for framed door configurations. The Shaker SKU follows Stegbar's Shop Online product pages, as the PDF has no Shaker section. Each uses one original photo from the built-in image tool; the website photographs are construction references and are not shipped. Colour changes fade; door count and dimensions redraw immediately.

Walk-in wardrobes follow the Signature PDF's two layouts and whiteboard finish, with a 2400 × 2400mm footprint. The existing shop SKU now offers Forma 4 (L-shaped LS01) and Forma 5 (U-shaped US01). The user's earlier fixed 2000mm height is retained; shelf depth is 447mm. Hardware colour is White, Polished Silver or Black, following page 25. These replace the previous Galleria-derived shop choices rather than combining the two supplier ranges. See [walk-in-wardrobes.md](walk-in-wardrobes.md).

**Mirrors with Cabinets** uses `mirrors-cabinets-open.webp`. Stegbar's [Pill with White Cabinet](https://www.stegbar.com.au/products/pill-with-white-cabinet) open-door photograph was supplied directly to the built-in image tool as a construction reference, alongside Klay's approved quiet mirror image for room styling. The resulting original photograph shows a recessed white cabinet, two shelves, concealed hinges and a shaped mirror door viewed at an angle. The earlier closed, frontal draft was removed from public assets. The source Stegbar image is not shipped.

The only product choice is **Shape: Gothic, Round or Pill**; the shared Location field still identifies the room for the quote. Each shape's fixed specifications appear below the photograph and persist into the quote: Gothic **H800 × W500 × D150 mm**, Round **H600 × W600 × D150 mm**, Pill **H1000 × W500 × D150 mm**. White cabinet finish is fixed. Sizes and the 129mm carcass plus 21mm door depth were checked on the [Gothic](https://www.stegbar.com.au/products/gothic-with-white-cabinet), [Round](https://www.stegbar.com.au/products/round-with-white-cabinet) and Pill pages on 9 September 2026. No installation, hinge-hand, colour or size selectors were added. `cabinetMirror.ts` projects the three door outlines around a shared hinge axis; `CabinetMirrorPhotoLayers.tsx` retains the photographed cabinet and shelves while updating the angled mirror, backing and quiet wall reflection immediately. The perspective is illustrative, not a fabrication drawing.

Mirrors use `mirrors-quiet.webp`, an original built-in generation inspired by Stegbar's [Gothic](https://www.stegbar.com.au/products/gothic) and [framed Gothic](https://www.stegbar.com.au/products/gothic-with-gold-frame) photography. The selected image has a travertine vanity, soft sage-grey wall and clear mirror glass reflecting an uncluttered warm-white wall and a narrow doorway edge. A targeted built-in image edit removed the reflected shower, niche, towels and bottle. The rejected silver-gradient draft is not shipped. The previous reflection image was removed from public assets. It replaces the rejected plain rectangular draft; that draft was never shipped. Both cards open on Gothic. Framed shapes follow Stegbar's framed range: Gothic, Round and Pill. White, Golden and Black are the only frame finishes.

Dimensions were checked against Stegbar's public product data on 9 September 2026. All pairs below are **height × width, in mm**:

| SKU / shape | Available dimensions | Reference |
| --- | --- | --- |
| Frameless Gothic | 800 × 700; 900 × 700; 1000 × 700 | [Gothic](https://www.stegbar.com.au/products/gothic) |
| Frameless Round | 600 × 600; 800 × 800; 1000 × 1000 | [Round](https://www.stegbar.com.au/products/round) |
| Frameless Rectangular | 600 × 600; 900 × 600; 900 × 1200 | [Rectangular](https://www.stegbar.com.au/products/rectangular) |
| Frameless Oval | 800 × 700; 900 × 700; 1000 × 700 | [Oval](https://www.stegbar.com.au/products/oval) |
| Frameless Rectangle with radius corners | 800 × 700; 900 × 700; 1000 × 700 | [Radius corners](https://www.stegbar.com.au/products/rectangle-with-radius-corners) |
| Frameless D shaped | 750 × 900; 900 × 1200; 1100 × 1500 | [D shaped](https://www.stegbar.com.au/products/d-shaped) |
| Framed Gothic | 800 × 500 | [Gothic with frame](https://www.stegbar.com.au/products/gothic-with-white-frame) |
| Framed Round | 600 × 600; 900 × 900 | [Round with frame](https://www.stegbar.com.au/products/round-with-white-frame) |
| Framed Pill | 1000 × 500 | [Pill with frame](https://www.stegbar.com.au/products/pill-with-white-frame) |

`mirrorPhoto.ts` supplies both the configurator choices and physical preview dimensions. The paired `dimension` field prevents mixing unsupported heights and widths; it reconciles when the shape changes and persists the full pair into the quote and cart identity. `MirrorPhotoLayers.tsx` samples wall and reflection from the single photograph, keeping one camera scale and bottom mounting baseline. The wall extends from the unobstructed side strips without repeating seams. The reflection keeps its photographic scale and frames a narrow doorway edge at the right so even the smaller mirrors read as real glass; no shower scene or metallic silver gradient is reflected. Fine polished glass edges, contact shadows and a shaded 7mm frame lip follow the outline. Shape and size redraw immediately; only the frame colour uses the existing 320ms transition, with reduced motion respected. D shaped follows the reference's flat right edge. Curvature is a visual approximation, not a fabrication template.

Both semi-frameless previews use original photos made with the built-in image tool, guided by Stegbar's [Front Only](https://www.stegbar.com.au/products/front-only-screen) and [Front and Return](https://www.stegbar.com.au/products/front-and-return-screen) pages. Their height is 1950mm and their front widths are 800, 850, 900, 1050, 1200 and 1350mm. The return depths paired with those widths are respectively 850, 890, 910, 1010, 1010 and 1010mm. Only Matt Black and Bright Silver are offered, under Hardware colour. Clear glass is fixed; there is no clip/channel selector on a framed product. Both open at 1050mm, the listed size closest to the user's requested approximately 1100mm default. The fixed and radius screens open at 1100mm and keep their existing 2053mm height. All four shower product names end with showerscreen and all four use the Hardware colour label.

`SemiScreenPhotoLayers.tsx` combines the empty bathroom, photographed metal and a shared neutral reflection plate. The corrected images contain no reflected trees, greenery or window-shaped scenery. Glass reflections are blended independently of hardware tint; only metal receives the finish change. Width changes redraw immediately, preserving door width, knob/pivot size and jamb thickness. Continuous top and bottom rails stay straight; the return follows its paired depth. The front-only tiled jamb moves with the opening without scaling the bathroom textures. Colour changes use the existing 320ms transition and respect reduced motion. New images replace the earlier unshipped tree-reflection drafts; no obsolete drafts are kept in public assets.

Wardrobe and shelving layouts were checked against the existing visualiser. Forma 1 has two side-by-side rails and a short support; Forma 2 has a six-compartment shelf tower; Forma 3 has four drawers and three open compartments. Linen layouts have four shelves and respectively zero, one, or two front posts. Linen Broom has one front post and an open right-hand broom bay.

`shopPhotos.ts` binds each existing configuration ID to a photo and traced material regions. `ShopPhotoLayers.tsx` applies the same board decor textures used by the visualiser, orienting grain along the boards and retaining the photograph's illumination. Hanging rails and drawer pulls have separate metal masks. Honeycomb pleats and shutter slats retain local contrast through colour curves; Day & Night has separate transmissive and opaque regions. Zip mesh retains its view through to the garden and outdoor area.

Model images are decoded before changing the matching material masks, preventing a new layout's texture from appearing on the previous image. Wardrobe and shelving widths use the visualizer's `columnsFor` measurements, including fixed 507mm towers, shared dividers and evenly positioned shelf supports. Only the horizontal spans resize. The shop preview height is fixed at 2000mm, with the same camera scale, top and floor position across every layout and width. A fixed 1280 × 1024 frame prevents selecting a width from changing the image height or moving the controls. Photo crops and material masks move together, while grain keeps its physical scale. Existing configuration choices and visualizer product specifications are unchanged.

Joinery width and finish selections redraw immediately, with no interpolation or texture fade. Colour changes on honeycomb, roller shutters, zip mesh, shower fittings and the awning's fabric and cassette ease over 320ms. Rapid colour changes start from the currently visible colour, and reduced-motion preferences disable the transitions. Curtain, roller blind, Venetian and plantation previews retain their existing treatment. Pleated flyscreens use the same colour transition for their four frame finishes; Single/Double hardware redraws immediately.

Fixed frameless showerscreen has separate clip and channel photos, guided by Stegbar's [Clip Fixed Panel](https://www.stegbar.com.au/products/clip-fixed-panel) and [Channel Fixed Panel](https://www.stegbar.com.au/products/channel-fixed-panel) galleries. These are original generated images, produced with the built-in image tool. The existing configuration lists are unchanged: clip/channel mounting, their seven/six finishes and ten widths, with the existing 2053mm height. The catalogue name and enquiry link now say Fixed frameless showerscreen.

Radius corner fixed frameless showerscreen follows immediately in the catalogue, with Glass type first (Clear or Narrow-reeded), then the same Location, Fixed, Hardware colour and Dimensions controls. Four original generated edits retain the matching bathroom, with the free upper corner rounded and narrow vertical fluting on the reeded pair. References are Stegbar's [Radius Corner Clip Fixed](https://www.stegbar.com.au/products/radius-corner-clip-fixed-1) and [Radius Corner Channel Fixed](https://www.stegbar.com.au/products/radius-corner-channel-fixed-1). Those DIY listings show reeded glass; Clear is informed by the broader [custom frameless range](https://www.stegbar.com.au/products/frameless-shower-screens). Klay's existing sizes and finish choices are retained at the user's request, rather than adopting the DIY listings' stock-size limits or extra fixing-side selector. Glass type is included in quote options and cart identity so clear and reeded selections stay distinct.

`ShowerPhotoLayers.tsx` places the photographed glass over a matching empty bathroom. Width changes crop the glass in place and move its free edge immediately. Radius panels keep the rounded corner's size and shape, and reeding keeps its spacing. The floor clips keep their size and end offsets; wall clips stay anchored. The bathroom and shower fittings never stretch. Only the screen's traced clips or channels are recoloured, retaining photographed highlights and contact shadows; glass is not tinted. Images and the background are decoded together. The old static shower photo was removed.

Shower regression check: `node tools/verify-shower-photo.mjs` covers all four shower products, the two frameless mountings, the twelve semi-frameless sizes and defaults, Hardware colour labels, paired return depths, and, all 60 glass/mounting/width combinations, the existing finish choices and dependent-finish fallback, stable height and wall anchoring, rounded corners, field order, and distinct glass choices in quote/cart lines.

The room above and below the joinery uses one continuous opening region, independent of tower and support boundaries, so those boundaries do not cut through daylight or floorboards. The zip-screen window shot was replaced with an alfresco installation photograph and its mesh mask retraced; the superseded image was removed.

Width regression check: `node tools/verify-shop-widths.mjs` covers every available joinery width, stable height and frame, fixed towers, visualizer support positions, complete crop coverage and consistent grain scale.

The replaced product photos, old wardrobe category/range images, superseded fabric shots and zip masks were deleted. All active references now point to the new photos; older dated asset inventories remain historical records.

Validation: `node tools/verify-shop-photos.mjs`, `node tools/verify-fabric-shots.mjs`, `node tools/verify-asset-paths.mjs`, `node tools/verify-awning-colour.mjs`, TypeScript and the production build. Browser review covers both honeycomb types, light/dark exterior finishes, all seven joinery layouts, wood finishes and metal finishes.

### 10 September 2026 finish update

Sliding doors and walk-ins now use the exact current Stegbar website finish names with visible one-click swatches. The existing photos are reused with sourced MDF/vinyl/timber samples and isolated board masks. Both sliding styles have fixed 2000mm preview height and fixed camera scale across widths. Walk-ins retain the two approved PDF layouts and fixed 2000mm height, with four board finishes and one handle style in three colours. See `sliding-doors.md` and `walk-in-wardrobes.md` for current source decisions.
