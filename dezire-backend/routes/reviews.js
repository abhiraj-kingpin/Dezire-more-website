const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { requireAuth } = require('./auth');
const { upload, cloudinary } = require('../middleware/cloudinary');

function currentUserIdFromToken(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET).userId || null;
  } catch {
    return null;
  }
}

async function recomputeProductRating(productId) {
  const reviews = await Review.find({ productId }).select('rating').lean();
  const reviewCount = reviews.length;
  const rating = reviewCount ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
  await Product.findByIdAndUpdate(productId, { rating: Math.round(rating * 10) / 10, reviewCount });
}

function publicReview(review, userId) {
  return {
    id: review._id,
    productId: review.productId,
    userName: review.userName,
    rating: review.rating,
    title: review.title,
    text: review.text,
    images: review.images,
    verifiedPurchase: review.verifiedPurchase,
    helpfulCount: review.helpfulVotes.length,
    helpfulByMe: userId ? review.helpfulVotes.some(v => String(v) === String(userId)) : false,
    isMine: userId ? String(review.userId) === String(userId) : false,
    createdAt: review.createdAt,
  };
}

router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ error: 'Invalid product id' });

    const filter = { productId };
    if (req.query.minRating) filter.rating = { $gte: Number(req.query.minRating) };

    const sortMap = {
      newest:  { createdAt: -1 },
      oldest:  { createdAt: 1 },
      highest: { rating: -1 },
      lowest:  { rating: 1 },
      helpful: null,
    };
    const sortKey = req.query.sort || 'helpful';

    let reviews = await Review.find(filter).sort(sortMap[sortKey] || { createdAt: -1 }).lean();
    if (sortKey === 'helpful') reviews.sort((a, b) => b.helpfulVotes.length - a.helpfulVotes.length);

    const allReviews = await Review.find({ productId }).select('rating').lean();
    const breakdown = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: allReviews.filter(r => r.rating === star).length,
    }));
    const total = allReviews.length;
    const average = total ? allReviews.reduce((s, r) => s + r.rating, 0) / total : 0;

    const currentUserId = currentUserIdFromToken(req);

    res.json({
      data: reviews.map(r => publicReview(r, currentUserId)),
      total,
      average: Math.round(average * 10) / 10,
      breakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAuth, upload.array('images', 4), async (req, res) => {
  try {
    const { productId, rating, title, text } = req.body;
    if (!productId || !rating || !text) {
      return res.status(400).json({ error: 'Product, rating, and review text are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ error: 'Invalid product id' });

    const existing = await Review.findOne({ productId, userId: req.user._id });
    if (existing) return res.status(409).json({ error: 'You have already reviewed this product' });

    const verifiedPurchase = await Order.exists({
      customerEmail: req.user.email,
      'items.productId': productId,
    });

    const images = (req.files || []).map(file => ({ url: file.path, publicId: file.filename }));

    const review = await Review.create({
      productId,
      userId: req.user._id,
      userName: `${req.user.firstName} ${req.user.lastName || ''}`.trim(),
      rating: Number(rating),
      title,
      text,
      images,
      verifiedPurchase: !!verifiedPurchase,
    });

    await recomputeProductRating(productId);

    res.status(201).json({ success: true, review: publicReview(review, req.user._id) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'You have already reviewed this product' });
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/helpful', requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const already = review.helpfulVotes.some(v => String(v) === String(req.user._id));
    if (already) {
      review.helpfulVotes = review.helpfulVotes.filter(v => String(v) !== String(req.user._id));
    } else {
      review.helpfulVotes.push(req.user._id);
    }
    await review.save();

    res.json({ success: true, helpfulCount: review.helpfulVotes.length, helpfulByMe: !already });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (String(review.userId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only delete your own review' });
    }

    for (const img of review.images) {
      if (img.publicId) await cloudinary.uploader.destroy(img.publicId).catch(() => {});
    }

    const productId = review.productId;
    await review.deleteOne();
    await recomputeProductRating(productId);

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
