// ---------------------------------------------------------------------------
// /products is a redirect, not a page. It exists so the homepage has one stable
// link shape for its tiles and cards — /products?category=<slug> — and this file
// is the single place that decides where each of those can actually be shopped.
//
// It has to be a resolver rather than a filter because the catalogue and the
// router disagree about what Klay sells today. Roller blinds are routed and
// buyable: /blinds/roller-blinds for the listing, /products/:slug per product.
// Every curtain and wardrobe subcategory in data/categories.ts is still
// available:false and has no route at all — so those resolve to the enquiry
// form, because a customer who clicked "Wardrobes" should reach someone who can
// quote wardrobes, not a page of roller blinds and not a 404.
//
// When curtains or wardrobes get listing pages, this map is the only thing that
// changes.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ALL_SUBCATEGORY_SLUGS } from '../data/categories';

const BY_CATEGORY: Record<string, string> = {
  // The three top-level categories are real pages now, so they resolve to
  // themselves rather than to a stand-in. Anything still linking at
  // ?category=indoor lands where a tile click would.
  indoor: '/indoor',
  outdoor: '/outdoor',
  wardrobes: '/wardrobes',

  // The one product type that is actually routed and buyable, plus the blind-type
  // slugs the visualiser and the product pages use.
  'roller-blinds': '/blinds/roller-blinds',
  'dual-roller': '/products/duo',
  blockout: '/products/dusk',
  sunscreen: '/products/veil',
  'light-filter': '/products/haze',
  curtains: '/contact',
};

const FALLBACK = '/blinds/roller-blinds';

/** Every subcategory that has no page of its own goes to the enquiry form. Built
 * by difference from the taxonomy rather than typed out, so a type added to
 * data/categories.ts is routed the moment it exists — the previous hand-written
 * list is exactly the kind that goes stale silently, and a slug missing from it
 * fell through to a page of roller blinds. */
const resolve = (slug: string): string =>
  BY_CATEGORY[slug] ?? (ALL_SUBCATEGORY_SLUGS.includes(slug) ? '/contact' : FALLBACK);

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const category = searchParams.get('category');
    navigate(category ? resolve(category) : FALLBACK, { replace: true });
  }, [navigate, searchParams]);

  return null;
}
