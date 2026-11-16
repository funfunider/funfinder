import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure public/uploads directory exists
const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webp';
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `img-${sanitizedBase || 'upload'}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg|avif/i;
    const isMimeValid = allowed.test(file.mimetype);
    const isExtValid = allowed.test(path.extname(file.originalname).toLowerCase());
    if (isMimeValid || isExtValid) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF, SVG, AVIF) are allowed'));
  }
});

// Middleware to handle both 'image' and 'file' field names seamlessly
const flexibleUpload = (req, res, next) => {
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (req.files) {
      req.file = req.files['image']?.[0] || req.files['file']?.[0] || null;
    }
    next();
  });
};

/**
 * POST /api/upload
 * Universal single image upload endpoint
 */
router.post(['/', '/image', '/file'], flexibleUpload, async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file received. Please provide an image under field name "image" or "file".'
      });
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const relativeUrl = `/uploads/${file.filename}`;
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    return res.status(201).json({
      success: true,
      url: relativeUrl,
      full_url: fullUrl,
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image: ' + error.message
    });
  }
});

/**
 * POST /api/upload/multiple
 * Multiple images upload endpoint (up to 10 images)
 */
router.post('/multiple', upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files received.' });
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';

    const uploaded = files.map((file) => ({
      url: `/uploads/${file.filename}`,
      full_url: `${protocol}://${host}/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }));

    return res.status(201).json({
      success: true,
      count: uploaded.length,
      files: uploaded,
      urls: uploaded.map((f) => f.url)
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/upload/base64
 * Upload image provided as data URI base64 string
 */
router.post('/base64', async (req, res) => {
  try {
    const { data, filename = 'base64-upload.webp' } = req.body || {};
    if (!data) {
      return res.status(400).json({ success: false, message: 'Missing base64 "data" field.' });
    }

    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid base64 data URI format.' });
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    let ext = '.webp';
    if (mimeType.includes('png')) ext = '.png';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
    else if (mimeType.includes('gif')) ext = '.gif';
    else if (mimeType.includes('svg')) ext = '.svg';

    const uniqueName = `b64-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const targetPath = path.join(uploadDir, uniqueName);
    fs.writeFileSync(targetPath, buffer);

    const relativeUrl = `/uploads/${uniqueName}`;
    return res.status(201).json({
      success: true,
      url: relativeUrl,
      filename: uniqueName,
      size: buffer.length,
      message: 'Base64 image saved successfully'
    });
  } catch (error) {
    console.error('Base64 upload error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/upload/list
 * List recently uploaded images
 */
router.get(['/list', '/'], async (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';

    const list = files
      .filter((f) => !f.startsWith('.'))
      .map((filename) => {
        const stats = fs.statSync(path.join(uploadDir, filename));
        return {
          filename,
          url: `/uploads/${filename}`,
          full_url: `${protocol}://${host}/uploads/${filename}`,
          size: stats.size,
          mtime: stats.mtime
        };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 50);

    return res.json({ success: true, count: list.length, files: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
