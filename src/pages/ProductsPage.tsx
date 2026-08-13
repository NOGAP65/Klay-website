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

const BY_CATEGORY: Record<string, string> = {
  // The homepage's three top-level categories. Indoor is the whole routed,
  // buyable half of the business; the other two are enquiries because nothing
  // in the catalogue serves them yet.
  indoor: '/blinds/roller-blinds',
  outdoor: '/contact',
  wardrobes: '/contact',

  // Finer-grained slugs, used by the product cards, the range panels and the
  // footer.
  'roller-blinds': '/blinds/roller-blinds',
  'dual-roller': '/products/duo',
  blockout: '/products/dusk',
  sunscreen: '/products/veil',
  'light-filter': '/products/haze',
  // Not on sale yet — see the note above.
  'sheer-curtains': '/contact',
  'blockout-curtains': '/contact',
  curtains: '/contact',
};

const FALLBACK = '/blinds/roller-blinds';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const category = searchParams.get('category');
    navigate((category && BY_CATEGORY[category]) || FALLBACK, { replace: true });
  }, [navigate, searchParams]);

  return null;
}
