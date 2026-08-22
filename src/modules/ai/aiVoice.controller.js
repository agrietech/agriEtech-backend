const aiVoiceService = require('./aiVoice.service');

async function handleVoiceInquiry(req, res, next) {
  try {
    const { audioTranscript, language } = req.body || {};
    const userQuestion = req.body?.userQuestion || req.body?.question || req.body?.prompt || req.body?.text || req.query?.question || null;
    const audioFile = req.file || null;
    const lang = language || req.query.lang || req.user?.preferredLang || 'am';

    const result = await aiVoiceService.processVoiceInquiry({
      userQuestion,
      audioTranscript,
      audioFile,
      language: lang,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function handleTextToSpeech(req, res, next) {
  try {
    const { text, language } = req.body || {};
    const lang = language || req.query.lang || 'am';

    const result = await aiVoiceService.synthesizeSpeech({
      text: text || req.query.text,
      language: lang,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleVoiceInquiry,
  handleTextToSpeech,
};
