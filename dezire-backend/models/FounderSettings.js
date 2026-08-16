const mongoose = require('mongoose');

const founderSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'default' },
    name: { type: String, trim: true, default: 'Roop Kamal Taneja' },
    title: { type: String, trim: true, default: 'Founder & CEO' },
    quote: {
      type: String,
      trim: true,
      default: 'Fashion, for me, has never been just about fabric — it is about a woman’s story, stitched with heritage and worn with pride. Every collection we create carries that belief forward.',
    },
    bio: {
      type: String,
      trim: true,
      default: 'With a vision rooted in celebrating Indian craftsmanship, Roop Kamal Taneja founded Dezire More in 2013 to bring timeless ethnic elegance to the modern Indian woman. Under her leadership, the brand has grown from a small curated collection into a name trusted by thousands — built on an unwavering commitment to quality, artisanship, and customer trust.',
    },
    photo: { type: String },
    photoPublicId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FounderSettings', founderSettingsSchema);
