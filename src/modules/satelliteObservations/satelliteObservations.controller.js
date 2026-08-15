const satService = require('./satelliteObservations.service');

async function getObservations(req, res, next) {
  try {
    const { woredaId, source } = req.query;
    const data = await satService.getObservationsByWoreda(woredaId, source);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getObservations,
};
