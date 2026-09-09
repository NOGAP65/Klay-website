# Sliding wardrobe doors — 10 September 2026

The shop names are **Framed Sliding Wardrobe Doors** and **Shaker Sliding Wardrobe Doors**. Existing product IDs remain stable. The latest request uses Stegbar's current website for all finish names and choices. Existing dimension configurations remain in place; the displayed height is fixed at 2000mm for both styles.

## Framed: website finishes, existing Signature dimensions

Source: `Stegbar Signature Range Pitch Deck Final.pdf`, pages 14–17, April 2025. The dimensions below remain sourced from this PDF. Finishes now follow the website: MDF Natural Oak, MDF Prime Oak, Mirror/MDF Silver/Natural Oak, Mirror/MDF Silver/Prime Oak, Mirror Silver, Vinyl Sienna, Vinyl Linen, Vinyl Surf, Mirror/Vinyl Silver/Sienna, Mirror/Vinyl Silver/Linen, Mirror/Vinyl Silver/Surf. Hardware colours are Matt Black, Pearl White and Polished Silver.

| Doors | Height | Available widths | Mixed arrangement |
| --- | --- | --- | --- |
| Two | 2160mm | 1200, 1500, 1800, 2100, 2400mm | Mirror / Surf |
| Three | 2160mm | 2700, 3000, 3300, 3600mm | Surf / Mirror / Surf |

The two-door default is 2100mm wide. Switching to three doors selects 2700mm because two- and three-door size lists do not overlap. All nine sizes retain the 2160mm height.

Page 15's mirror row for WFRM-2118-2 prints W800. This is treated as an apparent missing leading 1: the same product code's Surf row and page 17's mixed row both specify W1800. No 800mm option is offered.

Visual references: [Framed Two Door](https://www.stegbar.com.au/products/framed-two-door) and [Framed Three Door](https://www.stegbar.com.au/products/framed-three-door). The website finish list supersedes the previous white-only PDF palette; dimension lists are unchanged.

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

Source samples and URLs are recorded in [sliding-door-finishes.json](sliding-door-finishes.json). Framed MDF, vinyl and metal samples come from Stegbar; Shaker timber decor samples come from Polytec. Samples retain their source colours and are compressed as WebP. The photograph's lighting and recessed-panel shadows are applied over the material. Timber grain runs along stiles and across rails. Mirror inserts reuse the approved quiet interior reflection, with no shower or trees.

The preview rebuilds two or three equal panels and resizes the opening while retaining border thickness. Both styles use a fixed 2000mm display height and a fixed camera scale in a 1280 � 1024 viewport. Width changes redraw only the width; no width-dependent zoom can shrink the product. Shaker uses the midpoint of its selected width band; the full selected size range persists in the quote. These are product previews, not fabrication drawings. Door count and size redraw immediately. Timber and hardware colours use 320ms transitions and respect reduced motion.

## Verification

`tools/verify-sliding-doors.mjs` checks all 297 framed and 120 Shaker combinations, valid dimensions, mirror placement, positive geometry, sourced finish files and distinct quote identities. Existing mirror and shop-photo verification checks shared configuration and asset integration. The production build and scoped lint are also checked.

Colours use one-click, always-visible swatches, with real texture samples and split mirror samples. The selected exact supplier name is shown below the row.
