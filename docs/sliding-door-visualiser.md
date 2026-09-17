# Sliding wardrobe doors

The visualiser and homepage embed offer **Wardrobes → Sliding doors**, with Framed and Shaker families, two or three doors, and the same material, hardware and opening choices as the shop. Direct entry uses `/visualiser?category=wardrobe&type=framed` or `type=shaker`. This mode uses a 3D room preview and does not mount the room-photo/upload controls.

## Product data and geometry

- `features/joinery/slidingDoors.ts` is the shared catalogue source. The shop and visualiser consume its public API. Invalid or incompatible dependent selections are reconciled to an offered option.
- `slidingDoorGeometry.ts` builds overlapping panels on two tracks in millimetres. Framed doors have narrow metal stiles; Shaker doors have timber stiles and rails surrounding recessed infills. Mirror placement follows the catalogue's mixed/all-mirror configuration.
- Display height remains 2000 mm, matching the existing shop presentation. Framed order dimensions retain their actual 2160 mm height; Shaker retains the supplier's height/width ranges. The preview uses the midpoint of a width range. The cart and quote retain the selected order limits, not the display dimensions.
- Frame profiles, overlaps and depth are illustrative construction dimensions, not a manufacturing drawing. Supplier references: [sliding door collection](https://www.stegbar.com.au/collections/sliding-wardrobe-doors), [Shaker three-door specifications](https://www.stegbar.com.au/products/shaker-sliding-three-door).

## Rendering and lifecycle

`SlidingDoorStage` uses the shared `Wardrobe3D` camera, 30-degree starting view, drag/zoom controls, loading overlay and error recovery. `slidingDoorScene` builds the door geometry and recessed room. Existing finish textures provide wood/vinyl detail; eased edges, recessed panels, metal roughness, room lighting and contact shadows provide depth.

Mirrors use Three.js planar reflection cameras, with a photographed opposite room as the backdrop. The reflection moves with the view; the photographed backdrop is an approximation rather than a fully modelled furnished room. Reflection targets use 512px unsigned-byte textures and disable recursive mirror passes. Shadows are computed on the initial scene draw and reused while orbiting. There is no continuous idle render loop. Scene-owned geometry, materials and render targets are disposed when a configuration is replaced. The shared environment is cached per graphics context and disposed on context loss.

The 3D scene requires WebGL. The existing retry screen handles unavailable/lost graphics contexts. Browser profiles do not substitute for testing every physical phone/GPU.

## Verification

- `sliding-doors-domain.spec.ts`: every offered family, door count, material and opening; continuous coverage, separated tracks, fixed display height, selection reconciliation and cart data.
- `sliding-doors-preview.spec.ts`: both families/counts, wood and mirrors, all hardware colours, width changes, visible canvas pixels, retained canvas, rotation/reset, cart, homepage navigation and absence of photo-upload actions. A delayed-texture regression confirms the previous frame remains visible and an old response cannot replace the latest finish or wall colour.
- Browser profiles: desktop light, Android dark, forced-dark Android, 320px basic Android and iOS/WebKit dark.
- Existing `joinery-preview.spec.ts` protects built-in wardrobes, walk-ins and shelving against scene-replacement/finish regressions.
- `npm run verify` covers types, architecture, lint regression limits, assets, production build, bundle budgets and security checks.
