const express = require('express');
const router = express.Router();
const controller = require('./aiVoice.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload');

// Voice inquiry with audio upload or text question
router.post('/voice-inquiry', authenticate, upload.single('audio'), controller.handleVoiceInquiry);

// Text-to-Speech synthesis configuration
router.post('/text-to-speech', authenticate, controller.handleTextToSpeech);
router.get('/text-to-speech', authenticate, controller.handleTextToSpeech);

module.exports = router;
