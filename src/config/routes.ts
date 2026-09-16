/** Active customer page URLs. Hosting rewrites are checked against these in tests. */
export const home = '/';
export const products = '/products';
export const about = '/about';
export const contact = '/contact';
export const howItWorks = '/how-it-works';
export const cart = '/cart';
export const book = '/book';
export const bookingConfirmed = '/booking/confirmed';
export const visualiser = '/visualiser';

/** Filter the existing shop; categories do not have separate pages. */
export const productsInCategory = (category: string) =>
  `${products}?category=${encodeURIComponent(category)}`;

/** The contact form, with the enquiry pre-labelled. */
export const contactAbout = (subject: string) =>
  `${contact}?product=${encodeURIComponent(subject)}`;
