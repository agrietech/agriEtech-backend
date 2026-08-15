// National agricultural overview dashboard
async function getDashboardSummary() {
  return {
    totalFarmsRegistered: 42,
    activeSensors: 86,
    monitoredWoredas: 18,
    activeEarlyWarnings: 3,
    nationalBelgSeasonVigor: {
      averageVci: 58.4,
      condition: 'NORMAL_TO_FAVORABLE',
    },
    compositeRiskDistribution: {
      greenCount: 12,
      yellowCount: 4,
      orangeCount: 2,
      redCount: 0,
    },
  };
}

// Regional risk and weather indicators
async function getRegionalBreakdown() {
  return [
    {
      region: 'Oromia',
      monitoredFarms: 18,
      avgRainfallMm: 62.4,
      avgVci: 61.2,
      alertStatus: 'YELLOW',
    },
    {
      region: 'Amhara',
      monitoredFarms: 14,
      avgRainfallMm: 78.1,
      avgVci: 66.8,
      alertStatus: 'GREEN',
    },
    {
      region: 'Somali',
      monitoredFarms: 6,
      avgRainfallMm: 14.5,
      avgVci: 32.0,
      alertStatus: 'ORANGE',
    },
  ];
}

module.exports = {
  getDashboardSummary,
  getRegionalBreakdown,
};
