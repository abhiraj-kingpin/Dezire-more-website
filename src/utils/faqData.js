export const FAQS = [
  {
    id: 'order-status',
    keywords: ['order status', 'track my order', 'where is my order', 'track order', 'my order'],
    question: 'How do I track my order?',
    answer: "I can look that up for you — I'll need to check your account.",
    isOrderLookup: true,
  },
  {
    id: 'delivery-time',
    keywords: ['delivery time', 'how long does delivery', 'shipping time', 'how many days', 'when will i get', 'delivery take'],
    question: 'How long does delivery take?',
    answer: 'Standard delivery takes 3–5 business days depending on your area, as every piece is made by professional tailors. Free shipping on orders above ₹2,500.',
  },
  {
    id: 'express-delivery',
    keywords: ['express delivery', 'faster delivery', 'urgent delivery', 'quick delivery'],
    question: 'Do you offer express delivery?',
    answer: 'Yes — express delivery is available in select cities and takes 1–2 business days for an additional charge at checkout.',
  },
  {
    id: 'size-guide',
    keywords: ['size guide', 'what size', 'sizing', 'size chart', 'measurements'],
    question: 'How do I find my size?',
    answer: "Check our Size Guide page for detailed measurements across all categories — I can take you there.",
    link: { label: 'Open Size Guide', url: '/size-guide' },
  },
  {
    id: 'discount-code',
    keywords: ['discount code', 'coupon', 'promo code', 'discount', 'offer code'],
    question: 'Do you have any discount codes?',
    answer: 'Use code DEZIRE10 at checkout for 10% off your order.',
  },
  {
    id: 'international-shipping',
    keywords: ['international shipping', 'ship outside india', 'ship abroad', 'deliver outside india'],
    question: 'Do you deliver internationally?',
    answer: 'Currently we ship only within India. International shipping will be announced on our site when available.',
  },
  {
    id: 'damaged-product',
    keywords: ['damaged product', 'broken item', 'received damaged', 'defective'],
    question: 'What if I receive a damaged product?',
    answer: 'Contact us within 48 hours of delivery with photos of the damaged item, and our team will help resolve it.',
  },
  {
    id: 'change-address',
    keywords: ['change my address', 'change delivery address', 'update address', 'wrong address'],
    question: 'Can I change my delivery address after ordering?',
    answer: 'Address changes are possible only before the order is shipped. Reach out via WhatsApp as soon as possible to request a change.',
  },
];

export const QUICK_REPLIES = [
  'Track my order',
  'Size guide',
  'New arrivals',
  'Discount codes',
];

export const CONTACT = {
  whatsappNumber: '918171761948',
  phoneDisplay: '+91 81717 61948',
  phoneHref: 'tel:+918171761948',
  email: 'hello@deziremore.in',
};
