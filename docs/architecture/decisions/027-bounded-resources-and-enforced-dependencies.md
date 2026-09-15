# ADR-027 — Enforce dependencies, bound retained resources, defer expensive work

Status: implemented, 16 September 2026. Applies to Klay.

The owner requested continued architecture, performance and reliability work. This authorises the targeted renderer resource-lifecycle changes below; earlier migration-only instructions to preserve those files byte-for-byte do not describe this work. The approved fold geometry, projection, colours and product configurations are preserved.

## Module ownership

- `src/app`: routing, page boundaries, navigation and application composition.
- `src/features`: customer-facing features with public `index.ts` entry points. Features never import application composition. Route components are explicit asynchronous entry points in the router, rather than eager barrel exports.
- `features/joinery`: shared wardrobe and shelving models, dimensions, hardware and artwork metadata. The catalogue can use these without importing the visualiser UI or Three.js.
- `features/fabrics`: supplied sample data, indexed palettes, hardware and colour cards. Catalogue and visualiser use the same source.
- `features/visualiser`: interactive state, photo ownership, rendering and configuration-to-quote conversion. Geometry remains beside the renderer that consumes it.
- `src/shared`, `src/design-system`, `src/config`: reusable browser infrastructure, visual primitives and configuration. These cannot depend on features or application code.
- `shared-core`: dependency-free price and quote contracts shared by browser and server.
- `netlify`: request transport, persistence adapters and payment transitions. Server modules cannot import browser code.

`tools/dependency-graph.mjs` uses the TypeScript resolver and syntax tree, including aliases, re-exports, side-effect imports, type imports and dynamic imports. `check-architecture.mjs` rejects upward dependencies, cross-feature internal imports and synchronous runtime cycles. Deliberately invalid edges prove the guard fails. Type-only edges still obey ownership boundaries but do not create runtime cycles.

The two lexical import restrictions were replaced with the resolved graph because relative paths within a feature were being incorrectly rejected. This does not waive module boundaries. The existing lint rule probes remain active for the rules they actually verify.

## Loading and work

The homepage stays eager. Its catalogue and visualiser sections load near the viewport, retaining stable hash anchors. Route pages and 3D code remain asynchronous. Shared feature barrels do not eagerly export page components.

Fabric indexes take O(n) time and space to build once. Name and palette map lookups are expected O(1); validating a collection scans a small, fixed range list. Palette arrays retain their identity. Cart operations remain O(n): baskets are small, ordered customer data, and a second mutable index would add coordination cost without a measured benefit.

Dependency traversal is O(V + E), plus the size of reported cycle paths. Image processing is proportional to pixel count. Photo preparation limits the working result to 1,600 pixels on its longest side; it does not eliminate the temporary cost of decoding the original file. 3D scene construction is proportional to generated geometry. Wall and hardware colour updates retain the scene; changing a board finish rebuilds its materials and geometry.

The navigation owns one passive scroll subscription and coalesces updates with animation frames. Once the relevant threshold is passed, unchanged snapshots avoid React updates. Pages no longer publish every scroll event into a global store.

## Resource ownership

`preparePhoto` returns one owned resource: an `ImageBitmap`, a URL and an idempotent disposal function. Replacement, reset, failure and unmount release it. Superseded decodes cannot publish stale results. Pending preset fetches abort. Uploads use asynchronous blob encoding instead of base64 strings in React state.

Shared static images use an LRU cache capped at 16 entries and 32 MiB of estimated decoded RGBA memory. In-flight loads for a retained key share a promise. Rejections can retry. Hits and individual evictions are expected O(1); a large insertion can evict multiple entries. Eviction drops the cache's reference rather than closing a resource another renderer is using.

Uploaded blob/data images are not retained in that global cache. Per-photo lighting/diffusion caches are weakly owned and bounded. These limits apply to retained cache entries, not total browser/GPU memory or all concurrent decodes. Renderer teardown remains responsible for graphics resources.

## Customer data and payments

Direct visualiser quote links carry validated configurations for every selected window or joinery product. They contain no room photo or customer personal information. Invalid links fail visibly and cannot silently become a paid default roller order. Persisted baskets accept validated data only; saved values cannot replace store actions.

Payment event handling is independent of Stripe transport and database access. Amount, currency and session identity must match. A conditional database update lets only one concurrent delivery settle the order. Database failures propagate to a retryable webhook response. Expiry/failure events cannot downgrade a paid order.

Stripe session creation has an idempotency key scoped to the recorded order. This protects SDK retries for that order, not repeated HTTP checkout requests creating separate orders. Notifications remain best effort; a durable outbox and end-to-end checkout request deduplication are separate future changes requiring persistence design.

## Continuous enforcement

`npm run verify` checks types, resolved architecture, lint rules and rule probes, the lint regression baseline, asset references and the production build against byte budgets. Netlify uses this command. Content-hashed `/assets/*` files have immutable caching; unversioned public images do not.

`npm run test:browser` exercises domain rules and the production build using desktop Chromium, Android Chromium emulation and iPhone WebKit emulation, with light and dark preferences. CI installs both engines, runs the checks, audits deployed dependencies and retains reports. Test API writes are intercepted.

`tools/lint-baseline.json` records legacy warnings per file and rule. Errors and increased warning counts fail verification. The baseline is not a claim of zero technical debt and must not be regenerated simply to make a failing change pass.

## Basis

- [React effect lifecycle](https://react.dev/reference/react/useEffect) and [synchronising with effects](https://react.dev/learn/synchronizing-with-effects): explicit setup, cleanup and stale-result handling.
- [Vite build optimisation](https://vite.dev/guide/features#build-optimizations): explicit asynchronous boundaries for expensive features.
- [Stripe webhook guidance](https://docs.stripe.com/webhooks) and [idempotent requests](https://docs.stripe.com/api/idempotent_requests): duplicate delivery, retries and request identity are separate concerns.
- [Playwright emulation](https://playwright.dev/docs/emulation): browser/device profiles are repeatable coverage, not physical-device certification.

No framework migration, state library replacement, web worker or additional service was introduced without a demonstrated need. This remains one deployable website with enforceable internal boundaries.
