const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName:  { type: String, required: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title:  { type: String, trim: true },
    text:   { type: String, required: true, trim: true },
    images: [{ url: String, publicId: String }],

    verifiedPurchase: { type: Boolean, default: false },
    helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
