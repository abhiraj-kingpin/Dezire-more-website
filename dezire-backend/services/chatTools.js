const Product = require('../models/Product');
const Order = require('../models/Order');

// Mirrors the map already used for search-result links in src/components/Navbar.jsx —
// a product's raw `category` enum value doesn't always match its storefront route
// (e.g. 'western' lives at /western-apparels), and there are no per-product detail
// pages, so a "product page URL" is really "that product's category page".
const CATEGORY_ROUTES = {
  sarees: '/sarees',
  'dress-materials': '/dress-materials',
  'ready-to-wear': '/ready-to-wear',
  blouses: '/ready-to-wear',
  western: '/western-apparels',
  'jewelry-accessories': '/jewelry-accessories',
  jewelry: '/jewelry-accessories',
  accessories: '/jewelry-accessories',
};

function productUrl(product) {
  const route = CATEGORY_ROUTES[product.category] || '/';
  return `${route}?q=${encodeURIComponent(product.name)}`;
}

// Only these fields ever leave this function — no cost price, SKU, admin
// fields, etc. reach the model regardless of what's on the Product document.
function whitelistProduct(product) {
  return {
    name: product.name,
    price: product.price,
    image: product.images?.[0]?.url || null,
    url: productUrl(product),
  };
}

const RESULT_LIMIT = 5;

// search_products(query, category?, minPrice?, maxPrice?) — the product text
// index (Product.js) only covers name/description/fabric, not colors/occasion;
// changing that index would also change the storefront's own live search as a
// side effect, so instead: run the real text search first, then top up with a
// colors/occasion match if it came up short, rather than touching the index.
async function searchProducts(args = {}) {
  const { query, category, minPrice, maxPrice } = args;
  const filter = { isActive: true };

  if (category && CATEGORY_ROUTES[String(category).toLowerCase().trim()]) {
    filter.category = String(category).toLowerCase().trim();
  }
  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = Number(minPrice);
    if (maxPrice != null) filter.price.$lte = Number(maxPrice);
  }

  const trimmedQuery = (query || '').trim();
  let matches = [];

  if (trimmedQuery) {
    matches = await Product.find({ ...filter, $text: { $search: trimmedQuery } })
      .select('name price images category')
      .limit(RESULT_LIMIT)
      .lean();

    if (matches.length < RESULT_LIMIT) {
      const seen = new Set(matches.map(p => String(p._id)));
      const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const supplemental = await Product.find({
        ...filter,
        _id: { $nin: [...seen] },
        $or: [{ colors: regex }, { occasion: regex }],
      })
        .select('name price images category')
        .limit(RESULT_LIMIT - matches.length)
        .lean();
      matches = [...matches, ...supplemental];
    }
  } else {
    // No search term — e.g. "show me sarees under 3000" gives only category/price.
    matches = await Product.find(filter).select('name price images category').limit(RESULT_LIMIT).lean();
  }

  return { products: matches.map(whitelistProduct) };
}

// check_order_status(orderNumber?) — orderNumber is the ONLY identifying
// argument accepted from the model. The query is always additionally scoped
// to the logged-in user's own verified email server-side; a customer email
// or arbitrary order ID is never accepted as an argument, so neither the
// model nor a prompt-injected message can be used to look up someone else's
// order. If no orderNumber is given, returns the customer's most recent
// orders instead of requiring them to know it.
async function checkOrderStatus(args = {}, user) {
  if (!user) return { requiresAuth: true };

  const orderNumber = args.orderNumber ? String(args.orderNumber).trim().toUpperCase() : undefined;
  const filter = { customerEmail: user.email, ...(orderNumber && { orderNumber }) };

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(orderNumber ? 1 : 3)
    .lean();

  if (!orders.length) return { found: false };

  return {
    found: true,
    orders: orders.map(order => ({
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      placedOn: order.createdAt,
      items: order.items.map(item => ({
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
      })),
    })),
  };
}

module.exports = { searchProducts, checkOrderStatus, CATEGORY_ROUTES, productUrl };
