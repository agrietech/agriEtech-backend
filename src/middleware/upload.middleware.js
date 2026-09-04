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

const MIME_TO_EXTENSION = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/mp3': '.mp3',
  'audio/mpeg': '.mp3',
  'audio/ogg': '.ogg',
  'audio/m4a': '.m4a',
  'audio/mp4': '.mp4',
  'audio/webm': '.webm',
  'audio/aac': '.aac',
};

// Disk storage configuration for general & vision uploads
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const targetDir = file.mimetype.startsWith('audio/') ? audioUploadDir : uploadDir;
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
    } catch (_e) {
      // Directory creation error handled by fs or multer
    }
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const ext = MIME_TO_EXTENSION[file.mimetype] || (file.mimetype.startsWith('audio/') ? '.wav' : '.jpg');
    const prefix = file.mimetype.startsWith('audio/') ? 'voice' : 'plantscan';
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    cb(null, `${prefix}_${uniqueSuffix}${ext}`);
  },
});

// File filter for camera photos, plant images, voice audio, and farm documents
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
  const allowedDocTypes = [
    'application/pdf',
    'application/json',
    'application/geo+json',
    'text/csv',
    'text/plain',
  ];

  if (
    allowedImageTypes.includes(file.mimetype) ||
    allowedAudioTypes.includes(file.mimetype) ||
    allowedDocTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: JPEG/PNG/WebP, WAV/MP3/M4A/OGG, and PDF/CSV/JSON documents.'), false);
  }
};

/**
 * Verify binary magic bytes / file signatures to prevent MIME-type spoofing
 */
function verifyFileMagicBytes(file) {
  if (!file || !file.path) return null;
  let fd;
  try {
    const buffer = Buffer.alloc(32);
    fd = fs.openSync(file.path, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 32, 0);
    fs.closeSync(fd);
    fd = null;

    if (bytesRead < 4) {
      return 'File is corrupted or too small to be valid';
    }

    const mime = (file.mimetype || '').toLowerCase();

    // JPEG
    if (mime === 'image/jpeg' || mime === 'image/jpg') {
      if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return null;
      return 'File signature mismatch: expected valid JPEG binary header (0xFFD8FF)';
    }

    // PNG
    if (mime === 'image/png') {
      if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      ) {
        return null;
      }
      return 'File signature mismatch: expected valid PNG binary header';
    }

    // WebP (RIFF....WEBP)
    if (mime === 'image/webp') {
      const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
      const isWebp = bytesRead >= 12 && buffer.toString('ascii', 8, 12) === 'WEBP';
      if (isRiff && isWebp) return null;
      return 'File signature mismatch: expected valid WebP binary header';
    }

    // WAV (RIFF....WAVE)
    if (mime === 'audio/wav' || mime === 'audio/x-wav') {
      const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
      const isWave = bytesRead >= 12 && buffer.toString('ascii', 8, 12) === 'WAVE';
      if (isRiff && isWave) return null;
      return 'File signature mismatch: expected valid WAV binary header';
    }

    // MP3 (ID3 tag or MPEG sync frame)
    if (mime === 'audio/mp3' || mime === 'audio/mpeg') {
      const isId3 = buffer.toString('ascii', 0, 3) === 'ID3';
      const isMpegSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
      if (isId3 || isMpegSync) return null;
      return 'File signature mismatch: expected valid MP3 binary header';
    }

    // OGG (OggS)
    if (mime === 'audio/ogg') {
      if (buffer.toString('ascii', 0, 4) === 'OggS') return null;
      return 'File signature mismatch: expected valid OGG binary header';
    }

    // M4A / MP4 (....ftyp)
    if (mime === 'audio/m4a' || mime === 'audio/mp4') {
      if (bytesRead >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') return null;
      return 'File signature mismatch: expected valid MP4/M4A binary header';
    }

    // PDF (%PDF)
    if (mime === 'application/pdf') {
      if (buffer.toString('ascii', 0, 4) === '%PDF') return null;
      return 'File signature mismatch: expected valid PDF document header';
    }

    // JSON / GeoJSON
    if (mime === 'application/json' || mime === 'application/geo+json') {
      const start = buffer.toString('utf8', 0, Math.min(bytesRead, 16)).trim();
      if (start.startsWith('{') || start.startsWith('[')) return null;
      return 'File signature mismatch: expected valid JSON structure';
    }

    // CSV / Plain text
    if (mime === 'text/csv' || mime === 'text/plain') {
      for (let i = 0; i < bytesRead; i++) {
        if (buffer[i] === 0x00) {
          return 'File contains illegal binary null characters for plain text/CSV';
        }
      }
      return null;
    }

    return null;
  } catch (err) {
    if (fd) {
      try {
        fs.closeSync(fd);
      } catch (_e) {}
    }
    return `Unable to inspect file headers: ${err.message}`;
  }
}

function handleMagicByteValidation(file) {
  const validationError = verifyFileMagicBytes(file);
  if (validationError) {
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (_e) {}
    return validationError;
  }
  return null;
}

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
  },
  fileFilter,
});

// Wrap upload.single to transparently validate binary magic bytes
const originalSingle = upload.single.bind(upload);
upload.single = function (fieldName) {
  const multerHandler = originalSingle(fieldName);
  return (req, res, next) => {
    multerHandler(req, res, (err) => {
      if (err) return next(err);
      if (!req.file) return next();

      const validationError = handleMagicByteValidation(req.file);
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: {
            message: validationError,
            code: 'INVALID_FILE_SIGNATURE',
          },
        });
      }
      return next();
    });
  };
};

upload.verifyFileMagicBytes = verifyFileMagicBytes;

module.exports = upload;
