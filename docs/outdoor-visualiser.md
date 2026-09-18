# Outdoor visualiser

Roller shutters and zip screens live under **Outdoor coverings** in both the homepage visualiser and `/visualiser`. Direct links use `?category=roller-shutter` and `?category=zip-screen`.

Both use the existing local photo-upload, four-corner tracing, Canvas2D, download and cart flows. No external rendering service or WebGL context is needed. Default photographs depict an exterior house window and an open alfresco bay respectively. The existing shop colours and operation choices are shared, not copied into a second catalogue. Prices remain confirmed at measure.

## Mechanics

- Roller shutter: 42 mm nominal slat pitch, moving interlocked slats entering a fixed headbox, rigid bottom rail, matching guides outside the window opening. Slat spacing never compresses as it raises. Headbox and guides use the selected shutter colour.
- Shutter appearance: shallow asymmetric slat crowns, narrow interlocks, folded housing faces with shared end-cap vertices, and separate wall/contact shadows. Zip-screen appearance is independent of these shutter details.
- Zip screen: flat translucent mesh retained between side channels, fixed headbox and a moving weight bar. Light mesh scatters more light; dark mesh preserves more garden contrast. The frame stays charcoal because the catalogue offers mesh colour, not a frame-colour configuration.
- All surfaces project from the customer's traced quadrilateral. Exterior scenery is not dimmed when a screen closes. Mesh detail is bounded to prevent dense moiré and excessive drawing on phones.

The physical profiles are illustrative residential references, not an engineering specification for Klay's unconfirmed supplier. Roller nominal widths use the existing 900/1800/2700 mm size-band model; alfresco bays use 2400/3600/4800 mm. These inferred dimensions scale the preview only, and do not become order measurements. A photograph alone cannot determine exact real-world dimensions.

## Primary references

- [CW Products 42 mm single-line roller shutters](https://www.cwproducts.com.au/products/42mm-single-line-roller-shutters/): interlocking foam-filled aluminium, 42 mm coverage and 8.5 mm profile.
- [CW Products factsheet](https://www.cwproducts.com.au/wp-content/uploads/2022/06/42mmSingleLine_M2M_RollerShutter_Factsheet_2023.pdf): guide, headbox and bottom-bar proportions.
- [Zipscreen technology](https://www.zipscreen.com.au/zipscreen-difference/technology): concealed zip retention and taut mesh in side guides.
- [Zipscreen brochure](https://www.zipscreen.com.au/uploads/documents/Zipscreen_Brochure.pdf): headbox, side-channel and weight-bar proportions.

## Verification

`outdoor-geometry.spec.ts` covers constant pitch, travel limits, mesh-to-guide contact and catalogue/cart consistency. `outdoor-preview.spec.ts` covers colour pixels, full travel, preserved surroundings, default-scene switching, angled customer traces, downloads and cart details. Browser profiles include desktop Chromium, iOS WebKit, 320 px Android with WebGL disabled and Chromium forced dark mode. These are browser emulations, not certification of every physical handset.

[Image assets and exact generation prompts](outdoor-visualiser-images.md).
