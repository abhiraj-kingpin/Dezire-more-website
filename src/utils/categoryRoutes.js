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
