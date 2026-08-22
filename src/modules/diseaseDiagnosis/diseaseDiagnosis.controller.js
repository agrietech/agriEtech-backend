const diseaseService = require('./diseaseDiagnosis.service');

async function diagnose(req, res, next) {
  try {
    const { farmId, cropType, imageUrl, imageBase64, image, language } = req.body;
    const lang = language || req.query.lang || req.user?.preferredLang || 'en';
    const imageFile = req.file || null;
    const resolvedBase64 = imageBase64 || image || null;
    const data = await diseaseService.diagnoseCropImage({
      farmId,
      cropType,
      imageUrl,
      imageFile,
      imageBase64: resolvedBase64,
      language: lang,
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getAllDiagnoses(req, res, next) {
  try {
    const { farmId, cropType } = req.query;
    const data = await diseaseService.getAllDiagnoses({ farmId, cropType });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getDiagnosesByFarm(req, res, next) {
  try {
    const data = await diseaseService.getDiagnosesByFarm(req.params.farmId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  diagnose,
  getAllDiagnoses,
  getDiagnosesByFarm,
};
