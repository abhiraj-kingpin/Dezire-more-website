const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const z = require('zod/v4');
const Product = require('../models/Product');
const { searchProducts, productUrl, CATEGORY_ROUTES } = require('./chatTools');

// Public product catalog only — the same data the storefront already shows
// anyone who browses it. No auth, no order/customer data, no admin fields
// (cost price, SKU, exact stockCount, internal flags) ever leave here.
function whitelistProductDetails(product) {
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  return {
    name: product.name,
    description: product.description || '',
    price: product.price,
    originalPrice: product.originalPrice || null,
    discountPercent: discount,
    category: product.category,
    colors: product.colors || [],
    sizes: product.sizes || [],
    fabric: product.fabric || '',
    occasion: product.occasion || [],
    rating: product.rating || 0,
    reviewCount: product.reviewCount || 0,
    inStock: !!product.inStock,
    images: (product.images || []).map(img => img.url),
    url: productUrl(product),
  };
}

function getMcpServer() {
  const server = new McpServer({
    name: 'dezire-more-catalog',
    version: '1.0.0',
  });

  server.registerTool(
    'search_products',
    {
      title: 'Search Dezire More products',
      description: 'Search the public Dezire More product catalog (sarees, dress materials, ready-to-wear, casual western, jewelry & accessories) by keyword, category, and/or price range.',
      inputSchema: {
        query: z.string().optional().describe('Free-text search term, e.g. "red silk saree"'),
        category: z.enum(['sarees', 'dress-materials', 'ready-to-wear', 'western', 'jewelry-accessories']).optional()
          .describe('Restrict results to one storefront category'),
        minPrice: z.number().optional().describe('Minimum price in INR'),
        maxPrice: z.number().optional().describe('Maximum price in INR'),
      },
    },
    async (args) => {
      const result = await searchProducts(args);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    }
  );

  server.registerTool(
    'get_categories',
    {
      title: 'List Dezire More categories',
      description: 'List the storefront product categories and their URLs.',
      inputSchema: {},
    },
    async () => {
      const categories = [...new Set(Object.values(CATEGORY_ROUTES))].map(route => ({
        route,
        url: `https://www.deziremore.com${route}`,
      }));
      return { content: [{ type: 'text', text: JSON.stringify({ categories }) }] };
    }
  );

  server.registerTool(
    'get_product_details',
    {
      title: 'Get Dezire More product details',
      description: 'Get full public details (description, price, colors, sizes, fabric, occasion, rating, images) for one product by its exact or approximate name.',
      inputSchema: {
        name: z.string().describe('The product name, e.g. "Red Banarasi Silk Saree"'),
      },
    },
    async ({ name }) => {
      const escaped = String(name).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const product = await Product.findOne({
        isActive: true,
        name: new RegExp(escaped, 'i'),
      }).lean();
      if (!product) {
        return { content: [{ type: 'text', text: JSON.stringify({ found: false }) }] };
      }
      return { content: [{ type: 'text', text: JSON.stringify({ found: true, product: whitelistProductDetails(product) }) }] };
    }
  );

  return server;
}

module.exports = { getMcpServer };
