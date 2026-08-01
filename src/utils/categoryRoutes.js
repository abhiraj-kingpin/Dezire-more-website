// A product's raw `category` enum value doesn't always match its storefront
// route (e.g. the 'western' category lives at /western-apparels), and there
// are no per-product detail pages — every product link is really "that
// product's category page, pinned via ?q=". Shared by Navbar.jsx (search
// results) and ProductCard.jsx (canonical/OG URLs) so there's one mapping,
// not two copies drifting apart. Mirrors dezire-backend/services/chatTools.js's
// CATEGORY_ROUTES, which can't share this file directly across the
// frontend/backend runtime boundary.
export const CATEGORY_ROUTES = {
  sarees: '/sarees',
  'dress-materials': '/dress-materials',
  'ready-to-wear': '/ready-to-wear',
  blouses: '/ready-to-wear',
  western: '/western-apparels',
  'jewelry-accessories': '/jewelry-accessories',
  jewelry: '/jewelry-accessories',
  accessories: '/jewelry-accessories',
};

export function categoryRouteFor(product) {
  return CATEGORY_ROUTES[product.category] || '/';
}

export function productUrl(product) {
  return `${categoryRouteFor(product)}?q=${encodeURIComponent(product.name)}`;
}
