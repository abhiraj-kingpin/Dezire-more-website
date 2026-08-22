const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    rating:   { type: Number, required: true, min: 1, max: 5, default: 5 },
    text:     { type: String, required: true, trim: true },
    photo:         { type: String },
    photoPublicId: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

testimonialSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
