const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const adminAuth = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/cloudinary');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const paginate = (query, page, limit) => ({
  skip: (page - 1) * limit,
  limit: Number(limit),
});

const buildFilter = (query) => {
  const filter = { isActive: true };
  if (query.category) {
    const categoryValue = categoryFilterValue(query.category);
    filter.category = Array.isArray(categoryValue) ? { $in: categoryValue } : categoryValue;
  }
  if (query.color)       filter.colors      = { $regex: query.color, $options: 'i' };
  if (query.occasion)    filter.occasion    = { $regex: query.occasion, $options: 'i' };
  if (query.inStock)     filter.inStock     = query.inStock === 'true';
  if (query.tag)         filter.tags        = query.tag;
  if (query.subcategory) filter.subcategory = query.subcategory;
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  return filter;
};

// The storefront merged Jewelry+Accessories, and folded standalone "Blouses"
// into Ready to Wear. Products saved under the old category values keep
// showing up correctly on the merged pages via this alias map, so nothing
// has to be manually re-categorized in the database.
const CATEGORY_ALIASES = {
  'jewelry-accessories': ['jewelry-accessories', 'jewelry', 'accessories'],
  'ready-to-wear': ['ready-to-wear', 'blouses'],
};
const categoryFilterValue = (category) => CATEGORY_ALIASES[category] || category;

const buildSort = (sort) => {
  const sorts = {
    'price-asc':  { price: 1 },
    'price-desc': { price: -1 },
    'rating':     { rating: -1 },
    'newest':     { createdAt: -1 },
    'discount':   { originalPrice: -1 },
  };
  return sorts[sort] || { createdAt: -1 };
};

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, sort, search, ...filters } = req.query;
    const filter = buildFilter(filters);
    if (search) filter.$text = { $search: search };

    const [data, total] = await Promise.all([
      Product.find(filter)
        .sort(buildSort(sort))
        .skip(paginate(null, page, limit).skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/category/:category
router.get('/category/:category', async (req, res) => {
  try {
    const { page = 1, limit = 12, sort, ...filters } = req.query;
    const categoryValue = categoryFilterValue(req.params.category);
    const filter = {
      ...buildFilter(filters),
      category: Array.isArray(categoryValue) ? { $in: categoryValue } : categoryValue,
    };

    const [data, total] = await Promise.all([
      Product.find(filter)
        .sort(buildSort(sort))
        .skip(paginate(null, page, limit).skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/tag/:tag
router.get('/tag/:tag', async (req, res) => {
  try {
    const { page = 1, limit = 12, sort } = req.query;
    const filter = { isActive: true, tags: req.params.tag };

    const [data, total] = await Promise.all([
      Product.find(filter)
        .sort(buildSort(sort))
        .skip(paginate(null, page, limit).skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/home
router.get('/home', async (req, res) => {
  try {
    const [newArrivals, bestsellers, sale, totalProducts] = await Promise.all([
      Product.find({ isActive: true, tags: 'new-arrival' }).sort({ createdAt: -1 }).limit(8).lean(),
      Product.find({ isActive: true, tags: 'bestseller' }).sort({ rating: -1 }).limit(8).lean(),
      Product.find({ isActive: true, tags: 'sale' }).sort({ createdAt: -1 }).limit(8).lean(),
      Product.countDocuments({ isActive: true }),
    ]);

    const allRatings = await Product.find({ isActive: true }).select('rating').lean();
    const avgRating = allRatings.length
      ? (allRatings.reduce((s, p) => s + p.rating, 0) / allRatings.length).toFixed(1)
      : '4.8';

    res.json({
      sections: { newArrivals, bestsellers, sale },
      stats: { totalProducts, avgRating },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/search?q=silk
router.get('/search', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 12 } = req.query;
    if (!q.trim()) return res.json({ data: [], total: 0, page: 1, totalPages: 0 });

    const filter = {
      isActive: true,
      $or: [
        { name:        { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { fabric:      { $regex: q, $options: 'i' } },
        { category:    { $regex: q, $options: 'i' } },
        { occasion:    { $regex: q, $options: 'i' } },
      ],
    };

    const [data, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({ data, total, page: Number(page), totalPages: Math.ceil(total / limit), query: q });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    }).limit(4).lean();

    res.json({ product, related });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN ROUTES (protected) ─────────────────────────────────────────────────

// POST /api/products — create product with images (max 10) + optional video
router.post('/', adminAuth, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 },
]), async (req, res) => {
  try {
    const {
      name, category, subcategory, price, originalPrice,
      colors, sizes, fabric, occasion, description,
      inStock, stockCount, tags, sku,
    } = req.body;

    const images = (req.files?.images || []).map(file => ({
      url:      file.path,
      publicId: file.filename,
    }));

    const videoFile = req.files?.video?.[0];
    const video = videoFile ? { url: videoFile.path, publicId: videoFile.filename } : undefined;

    const product = await Product.create({
      name,
      category,
      subcategory,
      price:         Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      images,
      video,
      colors:   Array.isArray(colors)   ? colors   : colors?.split(',').map(s => s.trim())   || [],
      sizes:    Array.isArray(sizes)    ? sizes    : sizes?.split(',').map(s => s.trim())    || [],
      occasion: Array.isArray(occasion) ? occasion : occasion?.split(',').map(s => s.trim()) || [],
      fabric,
      description,
      inStock:    inStock !== 'false',
      stockCount: Number(stockCount) || 100,
      tags:       Array.isArray(tags) ? tags : tags?.split(',').map(s => s.trim()) || [],
      sku,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/products/:id — update product details
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const allowed = [
      'name', 'category', 'subcategory', 'price', 'originalPrice',
      'colors', 'sizes', 'fabric', 'occasion', 'description',
      'inStock', 'stockCount', 'tags', 'sku', 'rating', 'isActive',
    ];
    const updates = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/products/:id/images — add more images (max 10)
router.post('/:id/images', adminAuth, upload.array('images', 10), async (req, res) => {
  try {
    const newImages = (req.files || []).map(file => ({
      url:      file.path,
      publicId: file.filename,
    }));

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $push: { images: { $each: newImages } } },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json({ success: true, images: product.images });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id/images/:publicId — remove one image
router.delete('/:id/images/:publicId', adminAuth, async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.publicId);
    await Product.findByIdAndUpdate(req.params.id, {
      $pull: { images: { publicId: req.params.publicId } },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/products/:id/video — set/replace the showcase video
router.post('/:id/video', adminAuth, upload.fields([{ name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const videoFile = req.files?.video?.[0];
    if (!videoFile) return res.status(400).json({ error: 'No video file uploaded' });

    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    if (existing.video?.publicId) {
      await cloudinary.uploader.destroy(existing.video.publicId, { resource_type: 'video' });
    }

    existing.video = { url: videoFile.path, publicId: videoFile.filename };
    await existing.save();

    res.json({ success: true, video: existing.video });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id/video — remove the showcase video
router.delete('/:id/video', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.video?.publicId) {
      await cloudinary.uploader.destroy(product.video.publicId, { resource_type: 'video' });
    }
    product.video = undefined;
    await product.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id — soft delete
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, message: 'Product removed from store' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;