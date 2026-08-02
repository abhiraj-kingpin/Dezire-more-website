const express = require('express');
const router = express.Router();
const FounderSettings = require('../models/FounderSettings');
const adminAuth = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/cloudinary');
const { logAdminAction } = require('../utils/auditLog');

// GET /api/founder-settings — public, powers the "Founder" section on the
// Our Story page. Falls back to the schema defaults (the copy that used to
// be hardcoded) if no admin has saved anything yet.
router.get('/', async (req, res) => {
  try {
    let settings = await FounderSettings.findById('default').lean();
    if (!settings) settings = new FounderSettings().toObject();
    res.json({
      name: settings.name,
      title: settings.title,
      quote: settings.quote,
      bio: settings.bio,
      photo: settings.photo || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/founder-settings — admin only. A new photo replaces (and
// deletes) the old Cloudinary image, same as testimonials.
router.patch('/', adminAuth, upload.single('founderPhoto'), async (req, res) => {
  try {
    const settings = (await FounderSettings.findById('default')) || new FounderSettings();

    const { name, title, quote, bio } = req.body;
    if (name !== undefined) settings.name = name.trim();
    if (title !== undefined) settings.title = title.trim();
    if (quote !== undefined) settings.quote = quote.trim();
    if (bio !== undefined) settings.bio = bio.trim();

    if (req.file) {
      if (settings.photoPublicId) {
        await cloudinary.uploader.destroy(settings.photoPublicId).catch(() => {});
      }
      settings.photo = req.file.path;
      settings.photoPublicId = req.file.filename;
    }

    await settings.save();
    logAdminAction(req.admin.email, 'founder-settings.update', 'default', settings.name);
    res.json({
      success: true,
      name: settings.name,
      title: settings.title,
      quote: settings.quote,
      bio: settings.bio,
      photo: settings.photo || '',
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
