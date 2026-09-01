// ---------------------------------------------------------------------------
// THE BUSINESS'S OWN FACTS — one copy each.
//
// Created because its trigger fired, and the trigger was in §3 from the start:
// "a business fact written in two places." When it was finally checked rather
// than assumed, the answer was THREE — the phone number, email and street
// address were written out in app/layouts/Footer.tsx,
// features/marketing/components/AboutPage.tsx and ContactPage.tsx. D-12.
//
// WHY THIS IS WORTH A MODULE RATHER THAN A SHRUG. A phone number is the fact
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

/** Displayed. `phoneHref` is what it dials — they are not the same string. */
export const phone = '1300 00 KLAY';
export const phoneHref = 'tel:1300005529';

export const email = 'hello@klayinteriors.com.au';
export const emailHref = `mailto:${email}`;

export const address = '18 Maltings Cct, Epping VIC 3076';

/** The same opening hours, in the two lengths the site actually renders. */
export const hoursShort = 'Mon–Fri 8am–6pm';
export const hoursLong = 'Monday – Friday, 8am – 6pm';

export const coverage = 'Victoria-wide — Melbourne metro and surrounds';

/** The legal footer line. `tradingEntity` and `abn` are the registered company,
 * not the brand — Klay Interiors is what customers deal with, Grand Kaman Pty
 * Ltd is who they contract with, and the distinction is why both are here. */
export const brand = 'Klay Interiors';
export const tradingEntity = 'Grand Kaman Pty Ltd';
export const abn = 'ABN 98 151 010 007';

export const instagram = 'https://www.instagram.com/klayinteriors';
export const instagramHandle = '@klayinteriors';
