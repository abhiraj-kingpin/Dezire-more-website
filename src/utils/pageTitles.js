export const SUFFIX = ' | Dezire More';
export const SITE_URL = 'https://www.deziremore.com';
export const DEFAULT_DESCRIPTION = 'Dezire More — premium Indian ethnic wear: sarees, dress materials, ready-to-wear, casual western, and jewelry & accessories. Ethnic elegance, modern you.';

const TITLES = {
  '/': 'Dezire More – Ethnic Elegance. Modern You.',
  '/sarees': 'Sarees',
  '/dress-materials': 'Dress Materials',
  '/ready-to-wear': 'Ready to Wear',
  '/western-apparels': 'Casual Western',
  '/jewelry-accessories': 'Jewelry & Accessories',
  '/bestsellers': 'Bestsellers',
  '/new-arrivals': 'New Arrivals',
  '/membership': 'Premium Membership',
  '/our-story': 'Our Story',
  '/account': 'My Account',
  '/orders': 'My Orders',
  '/faq': 'FAQ',
  '/help-support': 'Help & Support',
  '/contact': 'Contact Us',
  '/size-guide': 'Size Guide',
  '/shipping-policy': 'Shipping Policy',
  '/exchange-policy': 'Exchange Policy',
  '/privacy-policy': 'Privacy Policy',
  '/terms-conditions': 'Terms & Conditions',
  '/verify-email': 'Verify Your Email',
};

// Only for routes worth having Google/social-share show something distinct
// from the homepage description — account/orders/verify-email are
// private/utility pages excluded from robots.txt anyway, so they fall back
// to the default rather than getting their own entry here.
const DESCRIPTIONS = {
  '/': DEFAULT_DESCRIPTION,
  '/sarees': 'Shop premium sarees at Dezire More — Banarasi silk, chiffon, organza, and embroidered styles for every occasion.',
  '/dress-materials': 'Unstitched dress materials in premium fabrics, ready to be tailored to your fit — shop the Dezire More collection.',
  '/ready-to-wear': 'Ready-to-wear ethnic fashion — kurtas, co-ords, and everyday festive styles from Dezire More.',
  '/western-apparels': 'Casual western wear with an ethnic touch — shop Dezire More\'s modern collection.',
  '/jewelry-accessories': 'Earrings, necklaces, bangles, and more — complete your look with Dezire More\'s jewelry & accessories.',
  '/bestsellers': 'Our most-loved pieces — shop Dezire More\'s bestselling sarees, dress materials, and accessories.',
  '/new-arrivals': 'The latest drops from Dezire More — new sarees, dress materials, and accessories added every week.',
  '/membership': 'Join Dezire More Premium Membership for exclusive pricing, early access, and member-only perks.',
  '/our-story': 'The story behind Dezire More — crafting ethnic elegance for the modern Indian woman.',
  '/faq': 'Answers to common questions about Dezire More orders, shipping, exchanges, and more.',
  '/help-support': 'Get help with your Dezire More order — contact our support team.',
  '/contact': 'Contact Dezire More — reach us via WhatsApp, email, or phone for any queries.',
  '/size-guide': 'Find your perfect fit with the Dezire More size guide.',
  '/shipping-policy': 'Dezire More shipping policy — delivery timelines, charges, and tracking information.',
  '/exchange-policy': 'Dezire More exchange policy — hassle-free exchanges within 3 days of delivery.',
  '/privacy-policy': 'Dezire More privacy policy — how we collect, use, and protect your information.',
  '/terms-conditions': 'Dezire More terms & conditions of use.',
};

// Private/account-gated routes intentionally excluded from robots.txt —
// no reason to spend effort giving them unique social-share copy.
// /account/* is a prefix match since it's a nested route (/account/profile,
// /account/addresses, etc.) — an exact match on '/account' alone stopped
// covering any of them the moment those became real sub-routes.
const NOINDEX_PATHS = new Set(['/orders', '/verify-email']);
const NOINDEX_PREFIXES = ['/account'];

export function titleForPath(pathname) {
  if (pathname === '/') return TITLES['/'];
  const label = TITLES[pathname];
  return label ? `${label}${SUFFIX}` : TITLES['/'];
}

export function descriptionForPath(pathname) {
  return DESCRIPTIONS[pathname] || DEFAULT_DESCRIPTION;
}

export function robotsForPath(pathname) {
  const noindex = NOINDEX_PATHS.has(pathname) || NOINDEX_PREFIXES.some(p => pathname.startsWith(p));
  return noindex ? 'noindex, follow' : 'index, follow';
}

export function urlForPath(pathname) {
  return `${SITE_URL}${pathname === '/' ? '' : pathname}`;
}
