# Sliding wardrobe doors — 9 September 2026

The shop names are **Framed Sliding Wardrobe Doors** and **Shaker Sliding Wardrobe Doors**. Existing product IDs remain stable. The user requested the attached PDF as the primary configuration source, with Stegbar's website used for pictures. The PDF does not contain Shaker doors, so that SKU follows Stegbar's Shop Online listings.

## Framed: Signature PDF

Source: `Stegbar Signature Range Pitch Deck Final.pdf`, pages 14–17, April 2025. Frames are **White** only. Panel material options are **Vinyl (Surf)**, **Mirror**, and **Vinyl (Surf) + Mirror**.

| Doors | Height | Available widths | Mixed arrangement |
| --- | --- | --- | --- |
| Two | 2160mm | 1200, 1500, 1800, 2100, 2400mm | Mirror / Surf |
| Three | 2160mm | 2700, 3000, 3300, 3600mm | Surf / Mirror / Surf |

The two-door default is 2100mm wide. Switching to three doors selects 2700mm because two- and three-door size lists do not overlap. All nine sizes retain the 2160mm height.

Page 15's mirror row for WFRM-2118-2 prints W800. This is treated as an apparent missing leading 1: the same product code's Surf row and page 17's mixed row both specify W1800. No 800mm option is offered.

Visual references: [Framed Two Door](https://www.stegbar.com.au/products/framed-two-door) and [Framed Three Door](https://www.stegbar.com.au/products/framed-three-door). The website's broader made-to-measure finish and dimension lists do not override the Signature PDF.

## Shaker: Shop Online

Sources: [Shaker Two Door](https://www.stegbar.com.au/products/shaker-sliding-two-door) and [Shaker Three Door](https://www.stegbar.com.au/products/shaker-sliding-three-door), verified against the visible product options and public product data.

- Door count: Two or Three.
- Door material & colour: Coastal Oak, Notaio Walnut, Antico Oak, Polar White, Mirror/Coastal Oak, Mirror/Notaio Walnut, Mirror/Antico Oak, Mirror/Polar White.
- Hardware colour: Matt Black, Polished Silver, Pearl White.
- Opening height range: 440–2440mm for both door counts.
- Two-door width ranges: 900–1470, 1471–1870, 1871–2370mm. Default: 1871–2370mm.
- Three-door width ranges: 2371–2740, 2741–3490mm. Default: 2371–2740mm.

The mirror is an insert inside the timber Shaker border. The two-door mirror preview follows the website's timber-left/mirror-right picture. Three doors use a centre mirror, with matching timber outer doors. Rails and stiles follow the listing's approximately 130mm border and 25mm timber construction; hardware is confined to tracks and flush pulls. The generic custom Galleria range is not combined with the Shop Online SKU.

## Photographs and finishes

Both photos were made using **built-in image generation**:

- `public/images/shop/sliding-framed.webp`
- `public/images/shop/sliding-shaker.webp`

Full generation prompts and original generated filenames are in [shop-photo-prompts.json](shop-photo-prompts.json). Stegbar product photography informed the construction briefs; no supplier room photograph is shipped. There were no old sliding-door product photographs to delete: both cards previously used a placeholder.

Source samples and URLs are recorded in [sliding-door-finishes.json](sliding-door-finishes.json). Surf and metal samples come from Stegbar; timber decor samples come from Polytec. Samples retain their source colours and are compressed as WebP. The photograph's lighting and recessed-panel shadows are applied over the material. Timber grain runs along stiles and across rails. Mirror inserts reuse the approved quiet interior reflection, with no shower or trees.

The preview rebuilds two or three equal panels and resizes the opening while retaining border thickness. Framed dimensions are shown in their selected proportions. Shaker uses the midpoint of the selected width range at an illustrative 2000mm height, called out beneath the photo; the full selected size range persists in the quote. These are product previews, not fabrication drawings. Door count and size redraw immediately. Timber and hardware colours use 320ms transitions and respect reduced motion.

## Verification

`tools/verify-sliding-doors.mjs` checks all 27 framed and 120 Shaker combinations, valid dimensions, mirror placement, positive geometry, sourced finish files and distinct quote identities. Existing mirror and shop-photo verification checks shared configuration and asset integration. The production build and scoped lint are also checked.
