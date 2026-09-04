const express = require('express');
const router = express.Router();
const controller = require('./media.controller');
const upload = require('../../middleware/upload.middleware');
const { authenticate } = require('../../middleware/auth.middleware');

// POST /api/v1/media/upload/public – Upload media/assets to 'agrEtech' public Supabase bucket
router.post('/upload/public', authenticate, upload.single('file'), controller.uploadPublic);

// POST /api/v1/media/upload/private – Upload confidential files to 'private' Supabase bucket (returns signed URL)
router.post('/upload/private', authenticate, upload.single('file'), controller.uploadPrivate);

// POST /api/v1/media/signed-url – Generate a fresh signed URL for an existing file in 'private' bucket
router.post('/signed-url', authenticate, controller.createSignedUrl);

module.exports = router;
