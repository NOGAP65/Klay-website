# Walk-in wardrobes — 9 September 2026

The existing `walk-in-wardrobes` SKU remains **Walk in wardrobes**. The user requested configurations from the supplied **Stegbar Signature Range Pitch Deck Final.pdf first**, with Stegbar's website filling gaps and guiding photography.

## Source decisions

Pages 23–25 of the PDF describe whiteboard walk-in wardrobes and show two plans, LS01 and US01. Both plans are 2400 × 2400mm, with 447mm-deep shelving. The shop names them **Forma 4** and **Forma 5**, continuing after the three built-in Forma names. The previous three shop choices came from the separate Galleria DIY range. They are replaced by these two Signature layouts.

| Shop model | Supplier plan | Shape | Construction |
| --- | --- | --- | --- |
| Forma 4 | LS01 | L-shaped | Six-compartment shelf tower at one end; single and double hanging around the corner; four drawers with three shelf compartments above at the other end |
| Forma 5 | US01 | U-shaped | Six-compartment shelf towers at the front ends; double hanging along both side runs; twin four-drawer towers with three shelf compartments above each at the back |

Height remains **2000mm**, following the user's explicit fixed-height instruction. This overrides the supplier's 2016mm overall height. The footprint is fixed to the PDF's 2400 × 2400mm plan; a 3000mm option is not carried over from the separate Galleria listings. There is no height or width control suggesting an unsupported size.

Board finish is **Whiteboard**. Hardware colours are **White, Polished Silver and Black**, as listed on page 25. The quote retains layout, footprint, height, shelf depth, board finish, hardware and room. No new prices are inferred from Stegbar's DIY retail prices.

Stegbar's [Galleria 7.0L](https://www.stegbar.com.au/products/galleria-wardrobe-7-0l), [9.0L](https://www.stegbar.com.au/products/galleria-wardrobe-9-0l) and [12.0U](https://www.stegbar.com.au/products/galleria-wardrobe-12-0u) listings were checked. They belong to a broader DIY range with different finishes, sizes and handle selections, so they do not override the PDF. The 9.0L room photo provided a photographic reference, while the PDF controlled the layout. The visualiser's existing legacy Galleria models are outside this shop-only change.

## Images and behaviour

Two original photos made with **built-in image generation** are saved as:

- `public/images/shop/walkin-ls01.webp`
- `public/images/shop/walkin-us01.webp`

Full prompts, references and original generated filenames are in [shop-photo-prompts.json](shop-photo-prompts.json). The supplied plan and Stegbar room photograph were references. The generated photos use a quiet room, real-looking floor and shelf shadows, clear hanging bays and minimal clothing. The supplier photo is not shipped.

Changing the model decodes the replacement image before swapping image and matching hardware masks together. Hardware changes redraw immediately, in line with the user's request to keep wardrobe changes unanimated. Only traced rails and drawer handles change finish. The room, clothing and whiteboard stay photographic. There were no previous walk-in shop photos to delete; the card previously displayed a placeholder. Visualiser assets remain in use and are retained.

`tools/verify-walk-in-wardrobes.mjs` checks the two layouts, six hardware combinations, fixed dimensions, image bindings, invalid old selections and complete quote details. Shared asset checks, TypeScript, scoped lint, desktop/mobile inspection and the production build complete the verification.
