const dayjs = require('dayjs');

/**
 * Standard Ethiopian Four-Season Model:
 * 1. ጸደይ / መኸር (Tseday / Meher) – Spring / Harvest (Sep - Nov | Meskerem, Tikimt, Hidar)
 * 2. በጋ (Bega) – Summer / Dry Season (Dec - Feb | Tahsas, Tir, Yakatit)
 * 3. በልግ / መፀው (Belg / Metsew) – Autumn / Short Rainy Season (Mar - May | Maggabit, Miyazya, Ginbot)
 * 4. ክረምት (Kiremt) – Winter / Long Rainy Season (Jun - Aug | Sene, Hamle, Nehasse)
 */
const ETHIOPIAN_SEASONS = {
  TSEDAY_MEHER: {
    code: 'TSEDAY_MEHER',
    nameEn: 'Tseday / Meher',
    nameAm: 'ጸደይ / መኸር',
    westernSeason: 'Spring / Harvest Season',
    gregorianMonths: 'September to November',
    ethiopianMonths: ['Meskerem', 'Tikimt', 'Hidar'],
    ethiopianMonthsAm: ['መስከረም', 'ጥቅምት', 'ኅዳር'],
    months: [9, 10, 11],
  },
  BEGA: {
    code: 'BEGA',
    nameEn: 'Bega',
    nameAm: 'በጋ',
    westernSeason: 'Summer / Dry Season',
    gregorianMonths: 'December to February',
    ethiopianMonths: ['Tahsas', 'Tir', 'Yakatit'],
    ethiopianMonthsAm: ['ታኅሣሥ', 'ጥር', 'የካቲት'],
    months: [12, 1, 2],
  },
  BELG_METSEW: {
    code: 'BELG_METSEW',
    nameEn: 'Belg / Metsew',
    nameAm: 'በልግ / መፀው',
    westernSeason: 'Autumn / Short Rainy Season',
    gregorianMonths: 'March to May',
    ethiopianMonths: ['Maggabit', 'Miyazya', 'Ginbot'],
    ethiopianMonthsAm: ['መጋቢት', 'ሚያዝያ', 'ግንቦት'],
    months: [3, 4, 5],
  },
  KIREMT: {
    code: 'KIREMT',
    nameEn: 'Kiremt',
    nameAm: 'ክረምት',
    westernSeason: 'Winter / Long Rainy Season',
    gregorianMonths: 'June to August',
    ethiopianMonths: ['Sene', 'Hamle', 'Nehasse'],
    ethiopianMonthsAm: ['ሰኔ', 'ሐምሌ', 'ነሐሴ'],
    months: [6, 7, 8],
  },
};

// Determine Ethiopian agricultural season
function getEthiopianSeason(date = new Date()) {
  const month = dayjs(date).month() + 1; // 1-12
  if (month >= 9 && month <= 11) return 'Meher';
  if (month === 12 || month <= 2) return 'Bega';
  if (month >= 3 && month <= 5) return 'Belg';
  return 'Kiremt';
}

// Get full structured season details
function getEthiopianSeasonInfo(date = new Date()) {
  const month = dayjs(date).month() + 1;
  if (month >= 9 && month <= 11) return ETHIOPIAN_SEASONS.TSEDAY_MEHER;
  if (month === 12 || month <= 2) return ETHIOPIAN_SEASONS.BEGA;
  if (month >= 3 && month <= 5) return ETHIOPIAN_SEASONS.BELG_METSEW;
  return ETHIOPIAN_SEASONS.KIREMT;
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
  ETHIOPIAN_SEASONS,
  getEthiopianSeason,
  getEthiopianSeasonInfo,
  getDekadOfYear,
  formatISODate,
  getRollingDateWindow,
  dayjs,
};
