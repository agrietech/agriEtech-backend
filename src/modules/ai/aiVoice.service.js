const fs = require('fs');
const openRouterClient = require('../../utils/openRouterClient');
const logger = require('../../utils/logger');

/**
 * AI Voice & Speech Service
 * Supports Amharic (አማርኛ) and English farmer voice inquiries and audio synthesis.
 */
async function processVoiceInquiry({ userQuestion, audioTranscript, audioFile, language = 'am' }) {
  let audioBase64 = null;
  let mimeType = 'audio/wav';

  if (audioFile && audioFile.path && fs.existsSync(audioFile.path)) {
    try {
      const buffer = fs.readFileSync(audioFile.path);
      audioBase64 = buffer.toString('base64');
      mimeType = audioFile.mimetype || 'audio/wav';
    } catch (err) {
      logger.warn(`[AIVoiceService] Failed to read audio file: ${err.message}`);
    }
  }

  logger.info(`[AIVoiceService] Processing voice inquiry in language=${language}`);

  const aiResult = await openRouterClient.processVoiceInquiry({
    userQuestion,
    audioTranscript,
    audioBase64,
    mimeType,
    language,
  });

  const data = aiResult.data || {};

  return {
    success: true,
    transcription: data.transcription || userQuestion || 'Voice input received',
    detectedLanguage: data.detectedLanguage || (language === 'en' ? 'English' : 'Amharic'),
    responseEn: data.responseEn || '',
    responseAm: data.responseAm || '',
    recommendedAction: data.recommendedAction || '',
    audioSynthesis: {
      format: 'audio/mp3',
      voiceAmharic: 'am-ET-Standard-A',
      voiceEnglish: 'en-US-Standard-C',
      playbackText: language === 'en' ? data.responseEn : data.responseAm,
      audioUrl: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(((language === 'en' ? data.responseEn : data.responseAm) || '').substring(0, 200))}&tl=${language === 'en' ? 'en' : 'am'}&client=tw-ob`,
    },
    aiModel: 'Google Gemini 2.5 Flash (OpenRouter Voice Intelligence)',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Text-to-Speech synthesis configuration & phonetic generator
 */
async function synthesizeSpeech({ text, language = 'am' }) {
  if (!text) {
    throw new Error('Text to synthesize is required');
  }

  const isAmharic = language === 'am' || /[\u1200-\u137F]/.test(text);
  const targetLang = isAmharic ? 'am' : 'en';
  const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.substring(0, 200))}&tl=${targetLang}&client=tw-ob`;

  return {
    success: true,
    text,
    language: isAmharic ? 'am-ET' : 'en-US',
    voice: isAmharic ? 'am-ET-Standard-A' : 'en-US-Standard-C',
    audioUrl,
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.95,
      pitch: 0.0,
      mimeType: 'audio/mpeg',
    },
    synthesisReady: true,
  };
}

module.exports = {
  processVoiceInquiry,
  synthesizeSpeech,
};
