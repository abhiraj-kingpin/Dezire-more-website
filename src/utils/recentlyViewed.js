const KEY = 'dm-recently-viewed';
const MAX_ITEMS = 12;

export function recordRecentlyViewed(product) {
  try {
    const id = product._id || product.id;
    if (!id) return;
    const image = product.image || product.images?.[0]?.url || product.images?.[0] || '';
    const entry = { id, name: product.name, image, price: product.price, category: product.category };
    const next = [entry, ...getRecentlyViewed().filter(p => p.id !== id)].slice(0, MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private browsing etc.) — recently-viewed is a nicety, skip silently.
  }
}

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

const CATEGORY_PATHS = {
  sarees: '/sarees',
  'dress-materials': '/dress-materials',
  'ready-to-wear': '/ready-to-wear',
  blouses: '/ready-to-wear',
  western: '/western-apparels',
  'jewelry-accessories': '/jewelry-accessories',
  jewelry: '/jewelry-accessories',
  accessories: '/jewelry-accessories',
};

export function categoryToPath(category) {
  return CATEGORY_PATHS[category] || '/';
}
