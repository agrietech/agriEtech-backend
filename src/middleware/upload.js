const multer = require('multer');
const path = require('path');
const fs = require('fs');

const os = require('os');
const logger = require('../utils/logger');

// Ensure upload directories exist
let uploadDir = path.join(__dirname, '../../uploads/diagnoses');
let audioUploadDir = path.join(__dirname, '../../uploads/audio');

try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  if (!fs.existsSync(audioUploadDir)) fs.mkdirSync(audioUploadDir, { recursive: true });
} catch (err) {
  // If container restricts /app/uploads, fallback gracefully to OS temporary directory
  logger.warn(`[Upload Middleware] Notice: ${err.message}. Using OS temp directory fallback.`);
  uploadDir = path.join(os.tmpdir(), 'agrietech/uploads/diagnoses');
  audioUploadDir = path.join(os.tmpdir(), 'agrietech/uploads/audio');
  try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    if (!fs.existsSync(audioUploadDir)) fs.mkdirSync(audioUploadDir, { recursive: true });
  } catch (_e) {}
}

// Disk storage configuration for general & vision uploads
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, audioUploadDir);
    } else {
      cb(null, uploadDir);
    }
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
