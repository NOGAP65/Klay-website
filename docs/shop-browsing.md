# Shop browsing — September 2026

The shop now offers nine product-type filters alongside the existing business groups, light-control options and order types. Every catalogue SKU belongs to exactly one browsing family. Unavailable combinations stay visible but disabled, and secondary groups disappear when they cannot narrow the result. Counts include the current search and other selected facets.

Search matches product names, descriptions, identifiers, families and light-control terms. It accepts common variations such as fly screen/flyscreens, shower screen/showerscreen and walk-in/walkin. Search may also find related products that offer the requested feature, such as sliding doors with mirror panels.

The URL stores search, filters and sorting. Refresh, sharing and browser Back restore those choices. Typing replaces the current history entry; filter and sort changes create history entries. Existing category links resolve to the relevant product family, so wardrobe links no longer show unrelated mirrors or showers. Campaign parameters are preserved. Product configurations remain in page state when cards are temporarily filtered out.

The compact results toolbar remains beneath the navigation while scrolling. On mobile, Filters opens a modal drawer with larger checkbox targets, scrollable contents, a fixed result-count button, Escape dismissal, keyboard focus containment and focus return. Active chips and clear actions provide recovery from narrow searches. The mobile banner grows to fit its text on small screens.

Result changes use fixed grey skeleton cards with a gentle sliding highlight while the next list is prepared, following the layout-preserving approach described in [Meta's Facebook redesign](https://engineering.fb.com/2020/05/08/web/facebook-redesign/). Search changes coalesce for 160ms while input and counts stay immediate. The previous grid retains page height behind the placeholder until the replacement is ready. Snapshot/reflow transitions have been removed; only the placeholder highlight moves. Product cards remain memoized; colour and dimension choices never trigger the browsing skeleton.

Mirrors offer only Bathroom 1–5 and Ensuite 1–5. Shelving offers Garage 1–3, Linen 1–5, Pantry 1–5 and Other. Shelving model codes LIN01, LIN02, LIN05 and LINBR02 display as Forma 6, 7, 8 and 9; the default is Forma 8 at 2700mm. Built-ins default to Forma 3 at 1800mm, Matt Polar White and Black handles. Walk-ins share the built-in three-colour palette and default to Matt Polar White with Brushed Matt Black handles. Native product dropdowns use bordered 42px controls with left-aligned text and clear chevrons.

The mobile drawer slides in and out with a fading backdrop. Its result count updates immediately, but the product grid waits until dismissal before changing. Reduced-motion preferences skip drawer travel; the placeholder highlight also stops for reduced-motion preferences.

Validation: `node tools/verify-shop-browsing.mjs`, TypeScript and production build. Browser checks cover desktop filtering, refresh and Back, 390px and 320px layouts, modal focus wrapping and dismissal, native sorting, empty-search recovery, retained product choices and sticky controls.

The header cart icon opens a compact basket below the top-right navigation on desktop and mobile. It shows quantities, configured options, priced subtotals and unpriced measure requests, with removal and a link to the full cart. Outside click, focus leaving the panel, Escape and navigation dismiss it; Escape returns focus to the trigger. Browser checks cover empty and mixed baskets, mobile bounds, removal and navigation. Built-in wardrobe defaults are checked by `node tools/verify-shop-defaults.mjs`: Forma 3, 1800mm, Matt Polar White and Black handles.
