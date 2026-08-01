import { FAQS } from './faqData';

const HUMAN_PHRASES = [
  'talk to a human', 'talk to human', 'real person', 'speak to someone',
  'talk to someone', 'human agent', 'customer care', 'customer support',
  'talk to an agent', 'speak to a human',
];

// Loose enough to catch "show me sarees", "looking for a kurta", "do you
// have jewelry under 2000", without needing a real NLP model for what's
// fundamentally still a small, closed set of storefront categories.
const PRODUCT_KEYWORDS = [
  'saree', 'sarees', 'dress material', 'kurta', 'kurtas', 'co-ord', 'coord',
  'ready to wear', 'western', 'jewelry', 'jewellery', 'accessories', 'earring',
  'necklace', 'bangle', 'lehenga', 'blouse', 'suit', 'show me', 'looking for',
  'do you have', 'find me', 'search for', 'new arrivals', 'bestseller',
];

const PRICE_PATTERN = /\b(under|below|less than|around|₹|rs\.?\s?\d|rupees)\b/i;

function normalize(text) {
  return (text || '').toLowerCase().trim();
}

function scoreKeywords(text, keywords) {
  return keywords.some(kw => text.includes(kw));
}

// The one entry point the widget calls per message. Returns a discriminated
// result the widget switches on to decide which pipeline tier handles it —
// FAQ and human-escalation resolve instantly with no network call at all;
// order/product route to a direct REST call; only 'ai' ever reaches Gemini.
export function matchIntent(rawText) {
  const text = normalize(rawText);
  if (!text) return { type: 'ai' };

  if (scoreKeywords(text, HUMAN_PHRASES)) {
    return { type: 'human' };
  }

  const faq = FAQS.find(f => scoreKeywords(text, f.keywords));
  if (faq) {
    return faq.isOrderLookup ? { type: 'order' } : { type: 'faq', entry: faq };
  }

  if (scoreKeywords(text, PRODUCT_KEYWORDS) || PRICE_PATTERN.test(text)) {
    return { type: 'product', query: rawText.trim() };
  }

  return { type: 'ai' };
}
