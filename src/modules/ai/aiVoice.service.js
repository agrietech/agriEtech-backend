const fs = require('fs');
const axios = require('axios');
const openRouterClient = require('../../utils/openRouterClient');
const logger = require('../../utils/logger');
const env = require('../../config/env');

/**
 * Strip markdown markers so Text-To-Speech synthesizes cleanly
 */
function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/[*#_`~>]/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/\n\s*[-•]\s*/g, '. ')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

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

  const query = (userQuestion || audioTranscript || '').trim();

  logger.info(`[AIVoiceService] Processing voice inquiry in language=${language}: "${query.substring(0, 50)}"`);

  const aiResult = await openRouterClient.processVoiceInquiry({
    userQuestion: query,
    audioTranscript,
    audioBase64,
    mimeType,
    language,
  });

  const data = aiResult.data || {};
  const isEnglish = language === 'en' || data.detectedLanguage === 'English';
  const rawSpeechText = isEnglish ? data.responseEn : data.responseAm;
  const speakableText = cleanTextForSpeech(rawSpeechText);

  const backendBaseUrl = env.APP_URL || 'https://agrietech.onrender.com';
  const targetLang = isEnglish ? 'en' : 'am';
  const proxyAudioUrl = `${backendBaseUrl}/api/v1/ai/tts-stream?text=${encodeURIComponent(speakableText.substring(0, 300))}&lang=${targetLang}`;
  const directTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(speakableText.substring(0, 200))}&tl=${targetLang}&client=tw-ob`;

  return {
    success: true,
    transcription: data.transcription || query || (isEnglish ? 'Voice inquiry received' : 'የድምፅ ጥያቄ ተቀብለናል'),
    detectedLanguage: data.detectedLanguage || (isEnglish ? 'English' : 'Amharic'),
    responseEn: data.responseEn || '',
    responseAm: data.responseAm || '',
    recommendedAction: data.recommendedAction || 'Inspect crop field and consult your local development agent.',
    audioSynthesis: {
      format: 'audio/mp3',
      voiceAmharic: 'am-ET-Standard-A',
      voiceEnglish: 'en-US-Standard-C',
      playbackText: rawSpeechText,
      speakableText,
      audioUrl: proxyAudioUrl,
      directAudioUrl: directTtsUrl,
    },
    audioUrl: proxyAudioUrl,
    audioUrlAm: `${backendBaseUrl}/api/v1/ai/tts-stream?text=${encodeURIComponent(cleanTextForSpeech(data.responseAm).substring(0, 300))}&lang=am`,
    audioUrlEn: `${backendBaseUrl}/api/v1/ai/tts-stream?text=${encodeURIComponent(cleanTextForSpeech(data.responseEn).substring(0, 300))}&lang=en`,
    aiModel: data.aiModel || 'Google Gemini 2.5 Flash (OpenRouter Voice Intelligence)',
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

  const cleanText = cleanTextForSpeech(text);
  const isAmharic = language === 'am' || /[\u1200-\u137F]/.test(cleanText);
  const targetLang = isAmharic ? 'am' : 'en';
  const backendBaseUrl = env.APP_URL || 'https://agrietech.onrender.com';
  const audioUrl = `${backendBaseUrl}/api/v1/ai/tts-stream?text=${encodeURIComponent(cleanText.substring(0, 300))}&lang=${targetLang}`;
  const directAudioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText.substring(0, 200))}&tl=${targetLang}&client=tw-ob`;

  return {
    success: true,
    text: cleanText,
    language: isAmharic ? 'am-ET' : 'en-US',
    voice: isAmharic ? 'am-ET-Standard-A' : 'en-US-Standard-C',
    audioUrl,
    directAudioUrl,
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.95,
      pitch: 0.0,
      mimeType: 'audio/mpeg',
    },
    synthesisReady: true,
  };
}

/**
 * Stream audio MP3 directly from TTS upstream proxy to bypass browser/mobile CORS blocks
 */
async function streamTtsAudio({ text, lang = 'am' }, res) {
  const clean = cleanTextForSpeech(text || 'AgriEtech').substring(0, 300);
  const targetLang = lang === 'en' ? 'en' : 'am';
  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(clean)}&tl=${targetLang}&client=tw-ob`;

  try {
    const upstreamRes = await axios.get(googleTtsUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Referer: 'https://translate.google.com/',
      },
      timeout: 10000,
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    upstreamRes.data.pipe(res);
  } catch (err) {
    logger.warn(`[AIVoiceService] TTS stream fallback warning: ${err.message}`);
    // Redirect to direct URL if stream proxy fails
    res.redirect(googleTtsUrl);
  }
}

module.exports = {
  processVoiceInquiry,
  synthesizeSpeech,
  streamTtsAudio,
  cleanTextForSpeech,
};
