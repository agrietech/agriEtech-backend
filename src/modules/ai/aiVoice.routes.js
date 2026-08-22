const express = require('express');
const router = express.Router();
const controller = require('./aiVoice.controller');
const { optionalAuthenticate } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload');

// Voice inquiry with audio upload or text question (open/optional auth for farmer ease of use)
router.post('/voice-inquiry', optionalAuthenticate, upload.single('audio'), controller.handleVoiceInquiry);
router.post('/text-inquiry', optionalAuthenticate, controller.handleVoiceInquiry);

// Text-to-Speech synthesis configuration
router.post('/text-to-speech', optionalAuthenticate, controller.handleTextToSpeech);
router.get('/text-to-speech', optionalAuthenticate, controller.handleTextToSpeech);
router.post('/speak', optionalAuthenticate, controller.handleTextToSpeech);
router.get('/tts-stream', controller.handleStreamTts);

module.exports = router;

