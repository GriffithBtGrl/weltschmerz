const router = require('express').Router();
const multer = require('multer');
const { uploadImage } = require('../services/cloudinaryService');
const { AppError } = require('../middleware/errorHandler');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new AppError('Formato de imagen no permitido', 400));
  },
});

router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No se recibió imagen', 400);
    const result = await uploadImage(req.file.buffer, req.file.mimetype);
    res.json({
      url:       result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;