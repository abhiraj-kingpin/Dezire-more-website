const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const adminAuth = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/cloudinary');
const { logAdminAction } = require('../utils/auditLog');

router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    res.json({ data: testimonials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
    res.json({ data: testimonials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', adminAuth, upload.single('photo'), async (req, res) => {
  try {
    const { name, location, rating, text, displayOrder } = req.body;
    if (!name || !text) return res.status(400).json({ error: 'Name and testimonial text are required' });

    const testimonial = await Testimonial.create({
      name,
      location,
      rating: rating ? Number(rating) : 5,
      text,
      displayOrder: displayOrder ? Number(displayOrder) : 0,
      photo: req.file?.path,
      photoPublicId: req.file?.filename,
    });

    logAdminAction(req.admin.email, 'testimonial.create', testimonial._id, testimonial.name);
    res.status(201).json({ success: true, testimonial });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id', adminAuth, upload.single('photo'), async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' });

    const { name, location, rating, text, displayOrder, isActive } = req.body;
    if (name !== undefined) testimonial.name = name;
    if (location !== undefined) testimonial.location = location;
    if (rating !== undefined) testimonial.rating = Number(rating);
    if (text !== undefined) testimonial.text = text;
    if (displayOrder !== undefined) testimonial.displayOrder = Number(displayOrder);
    if (isActive !== undefined) testimonial.isActive = isActive === 'true' || isActive === true;

    if (req.file) {
      if (testimonial.photoPublicId) {
        await cloudinary.uploader.destroy(testimonial.photoPublicId).catch(() => {});
      }
      testimonial.photo = req.file.path;
      testimonial.photoPublicId = req.file.filename;
    }

    await testimonial.save();
    logAdminAction(req.admin.email, 'testimonial.update', testimonial._id, testimonial.name);
    res.json({ success: true, testimonial });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' });
    if (testimonial.photoPublicId) {
      await cloudinary.uploader.destroy(testimonial.photoPublicId).catch(() => {});
    }
    logAdminAction(req.admin.email, 'testimonial.delete', testimonial._id, testimonial.name);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
