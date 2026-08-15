const dayjs = require('dayjs');

// Determine Ethiopian agricultural season (Belg, Kiremt, Bega)
function getEthiopianSeason(date = new Date()) {
  const month = dayjs(date).month() + 1;
  if (month >= 2 && month <= 5) return 'Belg';
  if (month >= 6 && month <= 9) return 'Kiremt';
  return 'Bega';
}

// Calculate 10-day dekad number (1 to 36)
function getDekadOfYear(date = new Date()) {
  const d = dayjs(date);
  const month = d.month();
  const day = d.date();
  const dekadInMonth = day > 20 ? 3 : day > 10 ? 2 : 1;
  return month * 3 + dekadInMonth;
}

// Format date to ISO YYYY-MM-DD
function formatISODate(date = new Date()) {
  return dayjs(date).format('YYYY-MM-DD');
}

// Calculate rolling window start and end dates
function getRollingDateWindow(days = 30, endDate = new Date()) {
  const end = dayjs(endDate);
  return {
    startDate: end.subtract(days, 'day').format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
  };
}

module.exports = {
  getEthiopianSeason,
  getDekadOfYear,
  formatISODate,
  getRollingDateWindow,
  dayjs,
};
