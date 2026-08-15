const boundariesService = require('./boundaries.service');

async function getRegions(_req, res, next) {
  try {
    const data = await boundariesService.getRegions();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getWoredas(req, res, next) {
  try {
    const data = await boundariesService.getWoredasByZone(req.query.zoneId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getWoredaDetails(req, res, next) {
  try {
    const data = await boundariesService.getWoredaById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Woreda not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRegions,
  getWoredas,
  getWoredaDetails,
};
