const express = require('express');
const router = express.Router();
const controller = require('./aiVoice.controller');
const { optionalAuthenticate } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload.middleware');

const { aiLimiter } = require('../../middleware/rate-limiter.middleware');

// Voice inquiry with audio upload or text question (open/optional auth for farmer ease of use)
router.post('/voice-inquiry', optionalAuthenticate, aiLimiter, upload.single('audio'), controller.handleVoiceInquiry);
router.post('/text-inquiry', optionalAuthenticate, aiLimiter, controller.handleVoiceInquiry);

// Text-to-Speech synthesis configuration
router.post('/text-to-speech', optionalAuthenticate, aiLimiter, controller.handleTextToSpeech);
router.get('/text-to-speech', optionalAuthenticate, aiLimiter, controller.handleTextToSpeech);
router.post('/speak', optionalAuthenticate, aiLimiter, controller.handleTextToSpeech);
router.get('/tts-stream', aiLimiter, controller.handleStreamTts);

module.exports = router;

