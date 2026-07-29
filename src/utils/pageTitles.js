const SUFFIX = ' | Dezire More';
const SITE_URL = 'https://www.deziremore.com';
const DEFAULT_DESCRIPTION = 'Dezire More — premium Indian ethnic wear: sarees, dress materials, ready-to-wear, casual western, and jewelry & accessories. Ethnic elegance, modern you.';

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
const NOINDEX_PATHS = new Set(['/account', '/orders', '/verify-email']);

export function titleForPath(pathname) {
  if (pathname === '/') return TITLES['/'];
  const label = TITLES[pathname];
  return label ? `${label}${SUFFIX}` : TITLES['/'];
}

function setMeta(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

// Keeps <title>, description, canonical, and Open Graph/Twitter tags in
// sync with the current route. This is a client-side-only SPA (no SSR), so
// crawlers/bots that don't execute JavaScript will still only ever see the
// homepage's static tags from index.html — this helps real browsers,
// Googlebot (which does render JS), and any share action taken from
// within the app itself, but not a non-JS link-preview bot hitting a deep
// URL directly. True per-route tags for those would require SSR/prerendering.
export function updateMetaTags(pathname) {
  const title = titleForPath(pathname);
  const description = DESCRIPTIONS[pathname] || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${pathname === '/' ? '' : pathname}`;

  document.title = title;
  setMeta('meta[name="description"]', 'content', description);
  setMeta('link[rel="canonical"]', 'href', url);
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', description);
  setMeta('meta[property="og:url"]', 'content', url);
  setMeta('meta[name="twitter:title"]', 'content', title);
  setMeta('meta[name="twitter:description"]', 'content', description);
  setMeta('meta[name="robots"]', 'content', NOINDEX_PATHS.has(pathname) ? 'noindex, follow' : 'index, follow');
}
