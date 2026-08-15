const diseaseService = require('./diseaseDiagnosis.service');

async function diagnose(req, res, next) {
  try {
    const { farmId, cropType, imageUrl } = req.body;
    const data = await diseaseService.diagnoseCropImage({ farmId, cropType, imageUrl });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  diagnose,
};
