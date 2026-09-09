# Walk-in wardrobes â€” 10 September 2026

The existing `walk-in-wardrobes` SKU remains **Walk in wardrobes**. The user requested configurations from the supplied **Stegbar Signature Range Pitch Deck Final.pdf first**, with Stegbar's website filling gaps and guiding photography. The latest request supersedes the PDF palette with the website's exact board and handle options.

## Source decisions

Pages 23â€“25 of the PDF describe whiteboard walk-in wardrobes and show two plans, LS01 and US01. Both plans are 2400 Ã— 2400mm, with 447mm-deep shelving. The shop names them **Forma 4** and **Forma 5**, continuing after the three built-in Forma names. The previous three shop choices came from the separate Galleria DIY range. They are replaced by these two Signature layouts.

| Shop model | Supplier plan | Shape | Construction |
| --- | --- | --- | --- |
| Forma 4 | LS01 | L-shaped | Six-compartment shelf tower at one end; single and double hanging around the corner; four drawers with three shelf compartments above at the other end |
| Forma 5 | US01 | U-shaped | Six-compartment shelf towers at the front ends; double hanging along both side runs; twin four-drawer towers with three shelf compartments above each at the back |

Height remains **2000mm**, following the user's explicit fixed-height instruction. This overrides the supplier's 2016mm overall height. The footprint is fixed to the PDF's 2400 Ã— 2400mm plan; a 3000mm option is not carried over from the separate Galleria listings. There is no height or width control suggesting an unsupported size.

Board finishes are **Matt Wardrobe White, Woodmatt Notaio Walnut, Matt Natural Oak and Woodmatt Antico Oak**. Handle choices are **T23 Inox, T24 Brushed Matt Black, T25 Brushed Brass, T26 Brushed Brass, T27 Inox and T28 Brushed Matt Black**. These names match both current 9.0L and 12.0U product pages. Board samples and source URLs are recorded in [walk-in-finishes.json](walk-in-finishes.json). The quote retains layout, footprint, height, shelf depth, board finish, hardware and room. No new prices are inferred from Stegbar's DIY retail prices.

Stegbar's [Galleria 7.0L](https://www.stegbar.com.au/products/galleria-wardrobe-7-0l), [9.0L](https://www.stegbar.com.au/products/galleria-wardrobe-9-0l) and [12.0U](https://www.stegbar.com.au/products/galleria-wardrobe-12-0u) listings were checked. Their finishes and handle selections now supply the palette, as explicitly requested. The PDF still supplies the two approved layouts and dimensions. The 9.0L room photo provided a photographic reference, while the PDF controlled the layout. The visualiser's existing legacy Galleria models are outside this shop-only change.

## Images and behaviour

Two original photos made with **built-in image generation** are saved as:

- `public/images/shop/walkin-ls01.webp`
- `public/images/shop/walkin-us01.webp`

Full prompts, references and original generated filenames are in [shop-photo-prompts.json](shop-photo-prompts.json). The supplied plan and Stegbar room photograph were references. The generated photos use a quiet room, real-looking floor and shelf shadows, clear hanging bays and minimal clothing. The supplier photo is not shipped.

Changing the model decodes the replacement image before swapping image and matching hardware masks together. Hardware changes redraw immediately, in line with the user's request to keep wardrobe changes unanimated. Traced board faces receive the selected supplier texture, with the photograph's shadows preserved. Shelf grain runs horizontally. Foreground clothing, towels and the polished hanging rails retain their original surfaces. The T23–T25 long tab and T26–T28 short tab handle profiles redraw in their selected finish, based on Stegbar's handle reference photographs. Room walls and floor remain unchanged. There were no previous walk-in shop photos to delete; the card previously displayed a placeholder. Visualiser assets remain in use and are retained.

`tools/verify-walk-in-wardrobes.mjs` checks the two layouts, 48 board/handle combinations, fixed dimensions, image bindings, invalid old selections and complete quote details. Shared asset checks, TypeScript, scoped lint, desktop/mobile inspection and the production build complete the verification.

All finishes are visible swatches like the blinds, with exact selected names underneath. Handle swatches include T23–T28 labels so the two profiles in each metal are distinguishable without opening a menu. Changes redraw immediately, with fixed camera framing and 2000mm height.

Handle shape references: [T23 Inox](https://www.stegbar.com.au/cdn/shop/files/T23_Inox.jpg?v=1767861531&width=1400), [T26 Brushed Brass](https://www.stegbar.com.au/cdn/shop/files/t26-brushed-brass.jpg?v=1767861358&width=1400). Hardware hexes are approximate midtones from these photographic metal references; exact board samples retain the supplier colours.
