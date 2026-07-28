const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      // The storefront now only exposes 5 top-level categories (sarees,
      // dress-materials, ready-to-wear, western, jewelry-accessories).
      // 'blouses'/'jewelry'/'accessories' are kept valid here purely so
      // older products already saved under them don't fail validation on
      // future edits — routes/products.js aliases them into the merged
      // categories so they still show up on the storefront.
      enum: ['sarees', 'dress-materials', 'ready-to-wear', 'western', 'jewelry-accessories', 'blouses', 'jewelry', 'accessories'],
      lowercase: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    // Images stored as array of Cloudinary URLs
    images: [
      {
        url: { type: String, required: true },   // Cloudinary URL
        publicId: { type: String, required: true }, // Cloudinary public_id (for deletion)
      },
    ],
    // Optional single showcase video (e.g. the outfit being worn/draped)
    video: {
      url: { type: String },
      publicId: { type: String },
    },
    colors: [{ type: String, trim: true }],
    sizes: [{ type: String, trim: true }],
    fabric: { type: String, trim: true },
    occasion: [{ type: String, trim: true }],
    description: { type: String, trim: true },
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, default: 100 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    tags: [{ type: String, enum: ['bestseller', 'new-arrival', 'sale', 'premium', 'everyday'] }],
    sku: { type: String, unique: true, sparse: true },
    isActive: { type: Boolean, default: true }, // soft delete
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
    toJSON: { virtuals: true },
  }
);

// Virtual: discount percentage (calculated, not stored)
productSchema.virtual('discount').get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

// Index for fast search
productSchema.index({ name: 'text', description: 'text', fabric: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);