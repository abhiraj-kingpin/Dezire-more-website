// Lightweight fuzzy product search. The full catalog is small enough
// (a few dozen items) to score entirely client-side on every keystroke,
// so search feels instant and needs no server round-trip or debounce.

const SYNONYMS = {
  sari: 'saree', saris: 'sarees', sary: 'saree',
  kurti: 'kurta', kurtis: 'kurtas',
  jewellery: 'jewelry', jewelery: 'jewelry',
  accesories: 'accessories', accessary: 'accessories', accesory: 'accessory',
  lehnga: 'lehenga', lehanga: 'lehenga',
  earing: 'earring', earings: 'earrings',
  blous: 'blouse', blouses: 'blouse',
  necklase: 'necklace',
  bangel: 'bangle', bangels: 'bangles',
  westren: 'western', wester: 'western',
};

function normalize(str) {
  return (str || '').toString().toLowerCase().trim();
}

function tokenize(str) {
  return normalize(str).split(/[^a-z0-9]+/).filter(Boolean);
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const al = a.length, bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  let prev = new Array(bl + 1);
  let curr = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}

function expandToken(token) {
  const variants = new Set([token]);
  if (SYNONYMS[token]) tokenize(SYNONYMS[token]).forEach(t => variants.add(t));
  return [...variants];
}

const FIELD_WEIGHTS = {
  name: 10,
  category: 6,
  subcategory: 6,
  tags: 5,
  occasion: 4,
  fabric: 4,
  colors: 4,
  description: 1,
};

function productFields(product) {
  const occasion = Array.isArray(product.occasion) ? product.occasion : [product.occasion];
  return {
    name: normalize(product.name),
    category: normalize(product.category).replace(/-/g, ' '),
    subcategory: normalize(product.subcategory).replace(/-/g, ' '),
    tags: (product.tags || []).map(normalize).join(' '),
    occasion: occasion.filter(Boolean).map(normalize).join(' '),
    fabric: normalize(product.fabric),
    colors: (product.colors || []).map(normalize).join(' '),
    description: normalize(product.description),
  };
}

function bestTokenScoreInField(token, fieldText, weight) {
  if (!fieldText) return 0;
  let best = 0;

  if (fieldText === token) return weight * 3.5;
  if (fieldText.includes(token)) best = Math.max(best, weight * 3);

  const words = fieldText.split(/\s+/).filter(Boolean);
  for (const word of words) {
    if (word.startsWith(token)) best = Math.max(best, weight * 2.2);
    const threshold = token.length <= 4 ? 1 : 2;
    if (Math.abs(word.length - token.length) <= threshold) {
      const dist = levenshtein(token, word);
      if (dist <= threshold) best = Math.max(best, weight * (threshold - dist + 1.2));
    }
  }
  return best;
}

export function scoreProduct(product, query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;
  const fields = productFields(product);

  let total = 0;
  for (const rawToken of tokens) {
    if (rawToken.length < 2) continue;
    const variants = expandToken(rawToken);
    let tokenBest = 0;
    for (const variant of variants) {
      for (const [fieldName, fieldText] of Object.entries(fields)) {
        const weight = FIELD_WEIGHTS[fieldName] || 1;
        tokenBest = Math.max(tokenBest, bestTokenScoreInField(variant, fieldText, weight));
      }
    }
    total += tokenBest;
  }
  return total;
}

export function searchProducts(products, query) {
  if (!normalize(query) || !Array.isArray(products)) return [];
  return products
    .map(product => ({ product, score: scoreProduct(product, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);
}

// Plain case-insensitive substring search for the search-as-you-type
// dropdown — deliberately not the fuzzy/typo-tolerant scorer above, so a
// single letter like "s" immediately surfaces every product containing it,
// refining further with each additional character. Name matches (what the
// dropdown actually displays) rank above matches found only in other
// fields, so the most relevant items lead.
export function searchSubstring(products, query) {
  const needle = normalize(query);
  if (!needle || !Array.isArray(products)) return [];

  const nameMatches = [];
  const otherMatches = [];
  for (const product of products) {
    const name = normalize(product.name);
    if (name.includes(needle)) { nameMatches.push(product); continue; }
    const other = normalize(
      [product.category, product.subcategory, product.fabric, ...(product.tags || [])]
        .filter(Boolean)
        .join(' ')
    );
    if (other.includes(needle)) otherMatches.push(product);
  }
  return [...nameMatches, ...otherMatches];
}

// Wraps substrings of `text` that match a query token in <mark> for highlighting.
export function highlightMatch(text, query) {
  const tokens = [...new Set(tokenize(query).filter(t => t.length >= 2))];
  if (!text || tokens.length === 0) return text;

  const escaped = tokens
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);
  const pattern = escaped.join('|');
  const splitRegex = new RegExp(`(${pattern})`, 'gi');
  const testRegex = new RegExp(`^(${pattern})$`, 'i');
  const parts = text.split(splitRegex);

  return parts.map((part, i) =>
    part && testRegex.test(part)
      ? <mark key={i} className="search-highlight">{part}</mark>
      : part
  );
}
