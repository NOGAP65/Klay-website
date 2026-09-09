# Shop browsing — September 2026

The shop now offers nine product-type filters alongside the existing business groups, light-control options and order types. Every catalogue SKU belongs to exactly one browsing family. Unavailable combinations stay visible but disabled, and secondary groups disappear when they cannot narrow the result. Counts include the current search and other selected facets.

Search matches product names, descriptions, identifiers, families and light-control terms. It accepts common variations such as fly screen/flyscreens, shower screen/showerscreen and walk-in/walkin. Search may also find related products that offer the requested feature, such as sliding doors with mirror panels.

The URL stores search, filters and sorting. Refresh, sharing and browser Back restore those choices. Typing replaces the current history entry; filter and sort changes create history entries. Existing category links resolve to the relevant product family, so wardrobe links no longer show unrelated mirrors or showers. Campaign parameters are preserved. Product configurations remain in page state when cards are temporarily filtered out.

The compact results toolbar remains beneath the navigation while scrolling. On mobile, Filters opens a modal drawer with larger checkbox targets, scrollable contents, a fixed result-count button, Escape dismissal, keyboard focus containment and focus return. Active chips and clear actions provide recovery from narrow searches. The mobile banner grows to fit its text on small screens.

Validation: `node tools/verify-shop-browsing.mjs`, TypeScript and production build. Browser checks cover desktop filtering, refresh and Back, 390px and 320px layouts, modal focus wrapping and dismissal, native sorting, empty-search recovery, retained product choices and sticky controls.
