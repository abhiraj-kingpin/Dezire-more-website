const Product = require('../models/Product');
const Order = require('../models/Order');

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

function whitelistProduct(product) {
  return {
    name: product.name,
    price: product.price,
    image: product.images?.[0]?.url || null,
    url: productUrl(product),
  };
}

const RESULT_LIMIT = 5;

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
    matches = await Product.find(filter).select('name price images category').limit(RESULT_LIMIT).lean();
  }

  return { products: matches.map(whitelistProduct) };
}

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
