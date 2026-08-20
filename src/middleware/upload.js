const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const logger = require('../utils/logger');

// Helper to safely get or create writable directory
function getWritableDir(primarySubdir, fallbackSubdir) {
  const primaryPath = path.resolve(__dirname, '../../uploads', primarySubdir);
  try {
    if (!fs.existsSync(primaryPath)) {
      fs.mkdirSync(primaryPath, { recursive: true });
    }
    // Test write permission
    fs.accessSync(primaryPath, fs.constants.W_OK);
    return primaryPath;
  } catch (_err) {
    const fallbackPath = path.join(os.tmpdir(), 'agrietech', fallbackSubdir);
    try {
      if (!fs.existsSync(fallbackPath)) {
        fs.mkdirSync(fallbackPath, { recursive: true });
      }
      return fallbackPath;
    } catch (_fallbackErr) {
      return os.tmpdir();
    }
  }
}

const uploadDir = getWritableDir('diagnoses', 'uploads/diagnoses');
const audioUploadDir = getWritableDir('audio', 'uploads/audio');

logger.debug(`[Uploads] Storage configured: images -> ${uploadDir}, audio -> ${audioUploadDir}`);

// Disk storage configuration for general & vision uploads
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const targetDir = file.mimetype.startsWith('audio/') ? audioUploadDir : uploadDir;
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    } catch (_e) {}
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith('audio/') ? '.wav' : '.jpg');
    const prefix = file.mimetype.startsWith('audio/') ? 'voice' : 'plantscan';
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    cb(null, `${prefix}_${uniqueSuffix}${ext}`);
  },
});

// File filter for camera photos, plant images & farmer audio voice clips
const fileFilter = (_req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedAudioTypes = [
    'audio/wav',
    'audio/x-wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/m4a',
    'audio/mp4',
    'audio/webm',
    'audio/aac',
  ];

  if (allowedImageTypes.includes(file.mimetype) || allowedAudioTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG/PNG/WebP images and WAV/MP3/M4A/OGG voice audio are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
  },
  fileFilter,
});

module.exports = upload;
