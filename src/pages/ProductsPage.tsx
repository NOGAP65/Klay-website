// ---------------------------------------------------------------------------
// /products is a redirect, not a page. It exists so the homepage's category
// strip has one stable link shape (/products?category=<slug>) and this file is
// the single place that decides where each category can actually be shopped.
//
// It has to be a resolver rather than a filter because the catalogue and the
// router disagree about what Klay sells today. Roller blinds are routed and
// buyable — /blinds/roller-blinds for the listing, /products/:slug per product.
// Every curtain and wardrobe subcategory in data/categories.ts is still
// available:false, and there is no /curtains or /wardrobes route: those
// resolve to the enquiry form, because a customer who clicked "Sheer Curtains"
// should get someone who can quote sheer curtains, not a page of roller blinds
// and not a 404.
//
// When curtains get a listing page, this map is the only thing that changes.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const DESTINATIONS: Record<string, string> = {
  'roller-blinds': '/blinds/roller-blinds',
  'dual-roller': '/products/duo',
  blockout: '/products/dusk',
  sunscreen: '/products/veil',
  'light-filter': '/products/haze',
  // Not on sale yet — see the note above.
  'sheer-curtains': '/contact',
  'blockout-curtains': '/contact',
  curtains: '/contact',
  wardrobes: '/contact',
};

const FALLBACK = '/blinds/roller-blinds';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const category = searchParams.get('category');
    navigate((category && DESTINATIONS[category]) || FALLBACK, { replace: true });
  }, [navigate, searchParams]);

  return null;
}
