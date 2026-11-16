import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getCollection, toIdFilter, getNextId } from '../db.js';

const router = Router();

const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webp';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'slider-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

// GET /slider/feed or /slider/all or /slider/list
router.get(['/feed', '/feed/', '/all', '/all/', '/list', '/list/', '/'], async (req, res) => {
  try {
    const slidersCol = await getCollection('sliders');
    const sliders = await slidersCol.find({}).sort({ order: 1, id: 1 }).toArray();
    return res.json(sliders);
  } catch (error) {
    console.error('Error fetching sliders:', error);
    return res.status(500).json({ message: 'Failed to fetch sliders' });
  }
});

// GET /slider/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const slidersCol = await getCollection('sliders');
    const slider = await slidersCol.findOne(toIdFilter(id));
    if (!slider) {
      return res.status(404).json({ message: 'Slider not found' });
    }
    return res.json(slider);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch slider' });
  }
});

// POST /slider/create
router.post(['/create', '/upload', '/'], upload.single('image'), async (req, res) => {
  try {
    const slidersCol = await getCollection('sliders');
    const nextId = await getNextId('sliders');
    const data = req.body || {};
    const file = req.file;

    const imagePath = file ? `/uploads/${file.filename}` : (data.image || '');

    const newSlider = {
      _id: nextId,
      id: nextId,
      title: data.title || '',
      description: data.description || '',
      image: imagePath,
      raw_image: imagePath,
      link: data.link || '',
      order: parseInt(data.order, 10) || 0,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      created_at: new Date().toISOString()
    };

    await slidersCol.insertOne(newSlider);
    return res.status(201).json(newSlider);
  } catch (error) {
    console.error('Error creating slider:', error);
    return res.status(500).json({ message: 'Failed to create slider' });
  }
});

// POST /slider/update/:id or PATCH /slider/update/:id
router.all(['/update/:id', '/:id'], upload.single('image'), async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const { id } = req.params;
    const slidersCol = await getCollection('sliders');
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;

    if (req.file) {
      const imgPath = `/uploads/${req.file.filename}`;
      updateData.image = imgPath;
      updateData.raw_image = imgPath;
    }

    if (updateData.order !== undefined) {
      updateData.order = parseInt(updateData.order, 10);
    }
    if (updateData.is_active !== undefined) {
      updateData.is_active = Boolean(updateData.is_active);
    }

    await slidersCol.updateOne(toIdFilter(id), { $set: updateData });
    const updated = await slidersCol.findOne(toIdFilter(id));
    return res.json(updated || { id: Number(id), ...updateData });
  } catch (error) {
    console.error('Error updating slider:', error);
    return res.status(500).json({ message: 'Failed to update slider' });
  }
});

// DELETE /slider/delete/:id or /slider/:id
router.delete(['/delete/:id', '/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const slidersCol = await getCollection('sliders');
    const result = await slidersCol.deleteOne(toIdFilter(id));
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Slider not found' });
    }
    return res.json({ success: true, message: 'Slider deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete slider' });
  }
});

export default router;
