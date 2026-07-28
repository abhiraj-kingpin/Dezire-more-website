const SUFFIX = ' | Dezire More';

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

export function titleForPath(pathname) {
  if (pathname === '/') return TITLES['/'];
  const label = TITLES[pathname];
  return label ? `${label}${SUFFIX}` : TITLES['/'];
}
