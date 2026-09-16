# Shopping experience: evidence and implementation

Reviewed 16 September 2026. Scope: Klay, preserving the approved visual identity, catalogue and product renderers.

## Outcome to optimise

Help customers find a suitable product, keep their chosen configurations, and complete an enquiry or purchase confidently. Longer time on site alone is not evidence of success: it can also mean confusion. The proposals below are applications of published research to the observed Klay interface, not measured conversion improvements on Klay.

## Findings and decisions

| Observed issue or decision | Evidence | Implemented response |
| --- | --- | --- |
| Route changes and deferred home sections could show a blank region on slower connections. | [NN/g: Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/) recommends placeholders that resemble the coming content and avoiding brief loading flashes. | Reserved space, a delayed visual reveal and split, row or text layouts. Content appears as soon as it is ready; no minimum wait. Offscreen home sections stay deferred. |
| Every filter change deliberately waited 160ms and hid all existing products. | [web.dev: Optimise CLS](https://web.dev/articles/optimize-cls) explains the importance of stable layout and reserving space. | Remove the artificial pause and keep current products visible while React prepares the next list. A small delayed status appears only for a longer update. Selection state survives filtering. |
| The add button briefly changed its label but offered no obvious next step. | [Baymard: Added-to-cart confirmation](https://baymard.com/ecommerce-design-examples/added-to-cart-confirmation) identifies clear paths to continue shopping and review the basket as important confirmation elements. | A compact, opaque confirmation with the actual added quantity, product name, View cart and Continue shopping. It never moves focus when it appears. |
| An accidental removal immediately lost a complete configured line. | [NN/g: User control and freedom](https://www.nngroup.com/articles/user-control-and-freedom/) supports clear exits and undoable actions. | Single-use Undo restores the quantity and all selected options. A newer cart action supersedes the previous undo. Removal remains immediate and easy. |
| Returning customers had to rediscover their existing basket. | [Baymard: Reducing cart abandonment](https://baymard.com/learn/reduce-cart-abandonment) separates browsing intent from fixable UX friction and recommends addressing the underlying cause. | An inline reminder appears when entering the shop with an existing cart. It links straight to the saved basket and respects dismissal for the browser session. Cart copy explains that choices are retained in this browser. |
| Installation was described as included while the product price said “+ install”. | The same Baymard research identifies unexpected costs and unclear totals as avoidable sources of abandonment. | Correct the conflicting assurance and home process text. Label the cart amount Product subtotal and explicitly state that installation is additional and confirmed at measure. Pricing calculations are unchanged. |
| The range spans windows, outdoor products, joinery and bathrooms; shoppers may be unsure where to begin. | [NN/g: Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) and [contextual guidance](https://www.nngroup.com/articles/onboarding-tutorials/) favour relevant help without overwhelming the primary task. | Optional Help me choose opens a short guide. Four goals filter the actual catalogue directly. A second topic explains sizes, check measure and quote-only products. |
| A validation failure could leave someone at the submit button, away from the invalid field. | [W3C: Status messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages) explains programmatic feedback; the existing inputs already associate errors with fields. | After validation renders, focus and centre the first invalid field. Preserve entered values. Check local field errors before asking for verification. |
| Modal interactions, small controls and animation can create barriers on phones or keyboards. | [W3C: Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) specifies contained focus, Escape and return focus. [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) sets a 24 CSS pixel minimum with exceptions. | Native dialog, labelled heading, visible close, opaque surfaces, mobile bottom sheet, focus restoration and scroll containment. New actions and cart quantity controls use at least 44px targets. Motion preferences disable shimmer and entrance movement. |

## Popup rules

The guide opens only on request. Add and remove confirmations follow a deliberate action and are nonmodal. Undo does not expire on a short timer. Confirmations clear on navigation or dismissal; only basket contents are persisted, not notifications or removed products. The saved-cart reminder is inline and dismissible. It does not block the page or collect contact details.

[NN/g's overlay research](https://www.nngroup.com/articles/overlay-overload/) describes the friction caused by competing interruptions. This implementation has no timed signup overlay, exit trap, disabled Back button, repeated removal confirmation, fabricated stock count or invented deadline. Retention here means preserving a customer's work and making the next useful step clear. Existing enquiry routes remain available to people who are not ready to order.

## Implementation boundaries

No new runtime dependency, marketing SDK, third-party tracking or image payload. Generic dialog and loading primitives live in the design system; basket state and feedback remain in the cart feature; the guide stays in catalogue. Multi-item adds now produce one store update rather than one per unit. Feedback is transient, and local storage continues to contain the basket only.

Browser-local saved baskets are not cross-device accounts. Clearing site data removes them. These changes do not establish new prices, offers, lead times, warranty terms or stock claims.

## Verification and measurement

New automated coverage checks dialog focus, Escape, measuring guidance, category selection, rapid searches, add confirmation, configuration-preserving undo, reminder dismissal, slow route loading, reduced motion and invalid-field focus. Store tests cover quantity caps, atomic adds and stale undo; persistence is tested against real browser storage and reloads. These run alongside the existing page, quote, payment, fabric and visualiser tests in desktop, Android-sized Chromium and iOS-sized WebKit, with light/dark preferences. Emulation is not certification on physical phones.

After release, assess successful product discovery, basket-to-enquiry completion, validation-error recovery and returning-basket completion. Compare mobile and desktop, monitor render responsiveness and layout shifts, and use qualitative shopper feedback. Do not infer a sales uplift from more time spent or from a research benchmark. No measurement service was installed in this change.

## Verification results

- The 85 existing regression cases passed in the complete test run. New tests exposed a modal keyboard-wrap issue and iOS focus restoration after touch; both were fixed.
- The final targeted run passed all 26 new checks: two cart-state tests and four browser scenarios across six device/appearance profiles. Persistence is checked in real browser storage rather than a simulated Node storage environment.
- Production build, application/server/test type checks, dependency boundaries, lint regression checks and asset checks pass. No new lint warnings were introduced.
- Final initial JavaScript: 77,006 bytes gzip, up 2,187 bytes from the prior 74,819-byte build and below the 85,000-byte budget. Total JavaScript: 329,062 bytes gzip. Published assets remain 50,318,372 bytes. No new package dependency.
- Manually reviewed the guide, cart confirmation and undo at desktop and 390px phone widths. Test items were removed and the preview viewport was restored.
