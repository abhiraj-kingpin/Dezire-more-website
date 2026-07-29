const mongoose = require('mongoose');

// Backs the homepage "Client Love" section — previously nine testimonials
// hardcoded directly in the frontend source, meaning adding/editing one
// meant a code change and a redeploy. Now managed from the admin panel.
const testimonialSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    rating:   { type: Number, required: true, min: 1, max: 5, default: 5 },
    text:     { type: String, required: true, trim: true },
    // Plain URL rather than the {url, publicId} shape products use — some
    // entries are migrated static files under /assets/testimonials/ with no
    // Cloudinary asset behind them, so publicId is tracked separately and
    // only set for photos actually uploaded through the admin panel.
    photo:         { type: String },
    photoPublicId: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

testimonialSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
