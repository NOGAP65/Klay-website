// ---------------------------------------------------------------------------
// THE BUSINESS'S OWN FACTS — one copy each.
//
// Created because its trigger fired, and the trigger was in §3 from the start:
// "a business fact written in two places." When it was finally checked rather
// than assumed, the answer was THREE — the phone number, email and street
// address were written out in app/layouts/Footer.tsx,
// features/marketing/components/AboutPage.tsx and ContactPage.tsx. D-12.
//
// WHY THIS IS WORTH A MODULE RATHER THAN A SHRUG. A contact detail is the fact
// most likely to change and least likely to be searched for exhaustively.
// Change it in the footer, miss the About page, and the site quotes two numbers
// with no error anywhere — no type breaks, no test fails, no lint rule fires.
// The address is worse, because it is on the path a customer follows to a
// booking.
//
// IT HAD ALREADY STARTED. The trading hours were "Mon–Fri 8am–6pm" in the
// footer and "Monday – Friday, 8am – 6pm" on the contact page: the same fact,
// two renderings, drifting in wording before it drifted in substance. Both are
// below, deliberately, as `hoursShort` and `hoursLong` — because the footer
// column genuinely needs the terse form and the contact table genuinely needs
// the full one. TWO PRESENTATIONS OF ONE FACT IS FINE. Two facts is not.
//
// §7: "Reads an environment variable -> config/env.ts". This is the sibling
// case — a constant nobody deploys differently, in the layer that owns what the
// site knows about itself.
// ---------------------------------------------------------------------------

/* NO PHONE NUMBER. `phone` was "1300 00 KLAY" and `phoneHref` the digits it
 * dialled, and they were printed in the footer's contact column, the About
 * page's one-line footer and the contact page's details table.
 *
 * REMOVED RATHER THAN BLANKED. An empty string would have rendered as an empty
 * table row, an orphan separator on the About line and a `tel:` link to
 * nothing; deleting the exports makes every call site a type error instead, so
 * the compiler found all three rather than the eye having to.
 *
 * THE PHONE FIELDS ON THE FORMS ARE UNTOUCHED, and they are a different thing:
 * those ask the CUSTOMER for a number so a technician can ring about a measure.
 * Nothing about withdrawing Klay's own number says stop collecting theirs.
 *
 * If a number comes back it comes back here, and the three call sites are in
 * this commit's diff. */

export const email = 'hello@klayinteriors.com.au';
export const emailHref = `mailto:${email}`;

export const address = '18 Maltings Cct, Epping VIC 3076';

/** The same opening hours, in the two lengths the site actually renders.
 *
 * 8–4, down from 8–6. Both strings, because they are two renderings of one
 * fact — see the note above on why that is fine and two facts is not. */
export const hoursShort = 'Mon–Fri 8am–4pm';
export const hoursLong = 'Monday – Friday, 8am – 4pm';

/** WHERE KLAY WILL TRAVEL, and it is the country now.
 *
 * This read "Victoria-wide — Melbourne metro and surrounds", which the trust
 * ticker stopped agreeing with when its coverage line became Australia-wide.
 * One of the two had to move and this is the one every other surface reads, so
 * it is the one that did: the contact page prints it as its Coverage field, and
 * the footer, the shop banner, the pricing note, the About page, the service-area
 * FAQ, the page's own meta description and the confirmation email all made the
 * same claim in their own words. Every one of them is now Australia.
 *
 * ONE CLAIM, NINE PLACES, and only this one is a constant. The rest were prose
 * — "installed by hand across Victoria" — which is why the site could contradict
 * itself for as long as it did: nothing links a sentence in a footer to a
 * sentence in an email. */
export const coverage = 'Australia-wide — every state and territory';

/** WHAT AUSTRALIA-WIDE DOES NOT COVER.
 *
 * The joinery, the screens and the mirrors are not available in WA. The window
 * furnishings are — blinds, curtains, shutters, awnings and the outdoor screens
 * all go everywhere — so this is an exclusion on four product families rather
 * than on a state.
 *
 * IT LIVES BESIDE `coverage` BECAUSE IT QUALIFIES IT, and a claim printed
 * without its exception is the more misleading half of one. Both are shown
 * together wherever coverage is stated: the contact page's details table and
 * the service-area answer on How It Works.
 *
 * NOT ENFORCED, and that is worth being plain about. Nothing stops a WA
 * postcode configuring a wardrobe and adding it to the cart — the catalogue has
 * no notion of where a product may go, and the quote is confirmed by a person
 * before anything is made. Stating it is the honest minimum; gating it is a
 * product decision about the shop, not a line of copy. */
export const coverageExclusion =
  'Wardrobes, shelving, showerscreens and mirrors are not available in WA.';

/** The legal footer line. `tradingEntity` is the registered company, not the
 * brand — Klay Interiors is what customers deal with, Grand Kaman Pty Ltd is
 * who they contract with, and the distinction is why both are here.
 *
 * NO `abn`. It was "ABN 98 151 010 007" and it was the third item on the
 * footer's copyright line. Removed as asked, and the export goes with the
 * usage so nothing is left holding a number the site no longer shows — the
 * trading entity stays, which is the part that says who the contract is with. */
export const brand = 'Klay Interiors';
export const tradingEntity = 'Grand Kaman Pty Ltd';

/** THE OFFICIAL ACCOUNT, and the handle is not the domain.
 *
 * These read `klayinteriors` — the domain's spelling — and the account is
 * `klay.interiors`, with the dot. Confirmed against the profile itself, which
 * titles as "Klay Interiors (@klay.interiors)". The old URL was a link to an
 * account that is not Klay's, which is worse than no link: the one place the
 * site sends people to see real work was sending them somewhere else.
 *
 * ONE PAIR, READ EVERYWHERE. The footer already read these; the homepage strip
 * printed "@klayinteriors" as a literal beside a href that came from here, so
 * the two could disagree and did nothing to say so. It reads the handle now. */
export const instagram = 'https://www.instagram.com/klay.interiors';
export const instagramHandle = '@klay.interiors';
