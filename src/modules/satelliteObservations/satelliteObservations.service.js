const { prisma, isConnected } = require('../../config/db');

// Retrieve satellite observation time-series
async function getObservationsByWoreda(woredaId, source) {
  if (isConnected() && woredaId) {
    const where = { woredaId, ...(source && { source }) };
    return await prisma.satelliteObservation.findMany({
      where,
      orderBy: { observationDate: 'desc' },
      take: 30,
    });
  }

  return [
    { id: 'sat_01', woredaId, source: source || 'CHIRPS', metric: 'precipitation_mm', value: 18.5 },
  ];
}

module.exports = {
  getObservationsByWoreda,
};
