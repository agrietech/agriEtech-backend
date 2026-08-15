const { mean, stdDev } = require('./statistics');

// Aggregate time-series metrics over daily, dekadal, or seasonal periods
function aggregatePeriodMetrics(dailySeries = []) {
  if (!dailySeries.length) {
    return { count: 0, sum: 0, avg: 0, min: 0, max: 0, std: 0 };
  }

  const values = dailySeries.map((item) => item.value || 0);
  const sum = values.reduce((acc, v) => acc + v, 0);

  return {
    count: values.length,
    sum: Math.round(sum * 100) / 100,
    avg: Math.round(mean(values) * 100) / 100,
    min: Math.round(Math.min(...values) * 100) / 100,
    max: Math.round(Math.max(...values) * 100) / 100,
    std: Math.round(stdDev(values) * 100) / 100,
  };
}

module.exports = {
  aggregatePeriodMetrics,
};
