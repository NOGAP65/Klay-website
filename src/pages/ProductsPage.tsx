// ---------------------------------------------------------------------------
// /products is a redirect, not a page. It exists so the homepage has one stable
// link shape for its tiles and cards — /products?category=<slug> and
// /products?room=<slug> — and this file is the single place that decides where
// each of those can actually be shopped.
//
// It has to be a resolver rather than a filter because the catalogue and the
// router disagree about what Klay sells today. Roller blinds are routed and
// buyable: /blinds/roller-blinds for the listing, /products/:slug per product.
// Every curtain and wardrobe subcategory in data/categories.ts is still
// available:false and has no route at all, and there are no room landing pages —
// so those resolve to the enquiry form, because a customer who clicked "Sheer
// Curtains" should reach someone who can quote sheer curtains, not a page of
// roller blinds and not a 404.
//
// When curtains or rooms get listing pages, these two maps are the only thing
// that changes.
// ---------------------------------------------------------------------------

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const BY_CATEGORY: Record<string, string> = {
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

// Rooms resolve to the product that room is usually specified for, which is the
// closest thing to a filtered result the catalogue can currently support.
// Outdoor has no product in the range at all, so it goes to an enquiry.
const BY_ROOM: Record<string, string> = {
  'living-room': '/blinds/roller-blinds',
  bedroom: '/products/dusk',
  'home-office': '/products/veil',
  outdoor: '/contact',
};

const FALLBACK = '/blinds/roller-blinds';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const category = searchParams.get('category');
    const room = searchParams.get('room');
    const to =
      (category && BY_CATEGORY[category]) || (room && BY_ROOM[room]) || FALLBACK;
    navigate(to, { replace: true });
  }, [navigate, searchParams]);

  return null;
}
