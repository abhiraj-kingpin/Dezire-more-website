const path = require('path');
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const mongoose = require('mongoose');
const { connectDB } = require('./db');

const Product = require('./models/Product');
const { productUrl } = require('./services/chatTools');
const { getMcpServer } = require('./services/mcpServer');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const productRoutes = require('./routes/products');
const adminRoutes   = require('./routes/admin');
const orderRoutes   = require('./routes/orders');
const reviewRoutes  = require('./routes/reviews');
const testimonialRoutes = require('./routes/testimonials');
const paymentSettingsRoutes = require('./routes/paymentSettings');
const founderSettingsRoutes = require('./routes/founderSettings');
const shippingRoutes = require('./routes/shipping');
const paymentMethodRoutes = require('./routes/paymentMethods');
const chatRoute      = require('./routes/chat');
const { router: authRoutes } = require('./routes/auth');
const { router: couponRoutes } = require('./routes/coupons');

const app = express();

app.set('trust proxy', 1);


app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const siteCors = cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://www.deziremore.com',
    'https://deziremore.com',
    'https://dezire-more-website-q2gf.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://localhost',
    'capacitor://localhost',
  ],
  credentials: true,
});
app.use((req, res, next) => (req.path === '/mcp' ? next() : siteCors(req, res, next)));
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

app.use((req, res, next) => {
  connectDB().then(() => next()).catch(next);
});


app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/reviews',  reviewRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/payment-settings', paymentSettingsRoutes);
app.use('/api/founder-settings', founderSettingsRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/coupons',  couponRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/chat',     chatRoute);

const mcpCors = cors();
app.post('/mcp', mcpCors, async (req, res) => {
  try {
    const server = getMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on('close', () => {
      transport.close();
      server.close();
    });
  } catch (err) {
    console.error('[mcp]', err.message);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
    }
  }
});
app.get('/mcp', mcpCors, (req, res) => {
  res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed — this is a stateless MCP server, POST only.' }, id: null });
});
app.delete('/mcp', mcpCors, (req, res) => {
  res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed — this is a stateless MCP server, no sessions to terminate.' }, id: null });
});

const SITE_URL = 'https://www.deziremore.com';
const SITEMAP_ROUTES = [
  { path: '/', priority: '1.0' },
  { path: '/sarees', priority: '0.9' },
  { path: '/dress-materials', priority: '0.9' },
  { path: '/ready-to-wear', priority: '0.9' },
  { path: '/western-apparels', priority: '0.9' },
  { path: '/jewelry-accessories', priority: '0.9' },
  { path: '/bestsellers', priority: '0.8' },
  { path: '/new-arrivals', priority: '0.8' },
  { path: '/membership', priority: '0.7' },
  { path: '/our-story', priority: '0.6' },
  { path: '/faq', priority: '0.5' },
  { path: '/help-support', priority: '0.5' },
  { path: '/contact', priority: '0.5' },
  { path: '/size-guide', priority: '0.4' },
  { path: '/shipping-policy', priority: '0.3' },
  { path: '/privacy-policy', priority: '0.2' },
  { path: '/terms-conditions', priority: '0.2' },
];
const SITEMAP_CACHE_MS = 3 * 60 * 60 * 1000;
let sitemapCache = { xml: null, generatedAt: 0 };

async function buildSitemapXml() {
  const lastmod = new Date().toISOString().slice(0, 10);
  const staticUrls = SITEMAP_ROUTES.map(r =>
    `  <url><loc>${SITE_URL}${r.path}</loc><lastmod>${lastmod}</lastmod><priority>${r.priority}</priority></url>`
  );

  const products = await Product.find({ isActive: true }).select('name category updatedAt').lean();
  const productUrls = products.map(p => {
    const productLastmod = (p.updatedAt || new Date()).toISOString().slice(0, 10);
    return `  <url><loc>${SITE_URL}${productUrl(p)}</loc><lastmod>${productLastmod}</lastmod><priority>0.6</priority></url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticUrls, ...productUrls].join('\n')}\n</urlset>\n`;
}

app.get('/sitemap.xml', async (req, res) => {
  try {
    const isStale = !sitemapCache.xml || (Date.now() - sitemapCache.generatedAt) > SITEMAP_CACHE_MS;
    if (isStale) {
      sitemapCache = { xml: await buildSitemapXml(), generatedAt: Date.now() };
    }
    res.set('Cache-Control', `public, max-age=${Math.floor(SITEMAP_CACHE_MS / 1000)}`);
    res.type('application/xml').send(sitemapCache.xml);
  } catch (err) {
    console.error('[sitemap]', err.message);
    const lastmod = new Date().toISOString().slice(0, 10);
    const urls = SITEMAP_ROUTES.map(r =>
      `  <url><loc>${SITE_URL}${r.path}</loc><lastmod>${lastmod}</lastmod><priority>${r.priority}</priority></url>`
    ).join('\n');
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
    );
  }
});

app.get('/api/health', async (req, res) => {
  const count = await require('./models/Product').countDocuments({ isActive: true });
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    products: count,
  });
});

module.exports = app;
