/**
 * @file smsFormatter.js
 * @description Intelligent SMS budgeting and template formatter for Ethiopian farmers.
 * Optimizes Ge'ez (UCS-2) and Latin (GSM 7-bit) message segment counts to minimize
 * telecom credit expenditures while delivering actionable emergency advisories.
 */

// Detect if string contains non-GSM characters (such as Ge'ez Ethiopic script)
function isUnicodeText(text) {
  if (!text) return false;
  // Non-GSM 7-bit character check
  return /[^\u0020-\u007E\u00A0-\u00FF\n\r]/.test(text);
}

/**
 * Calculate SMS segments and character metrics
 * @param {string} text
 * @returns {{ isUnicode: boolean, charCount: number, segmentCount: number, charsRemainingInSegment: number }}
 */
function calculateSmsMetrics(text) {
  if (!text) return { isUnicode: false, charCount: 0, segmentCount: 0, charsRemainingInSegment: 160 };

  const isUnicode = isUnicodeText(text);
  const charCount = text.length;

  let segmentSize = isUnicode ? 70 : 160;
  let multiSegmentSize = isUnicode ? 67 : 153;

  let segmentCount = 1;
  if (charCount <= segmentSize) {
    segmentCount = charCount > 0 ? 1 : 0;
  } else {
    segmentCount = Math.ceil(charCount / multiSegmentSize);
  }

  const maxCapacity = segmentCount === 1 ? segmentSize : segmentCount * multiSegmentSize;
  const charsRemainingInSegment = Math.max(0, maxCapacity - charCount);

  return {
    isUnicode,
    charCount,
    segmentCount,
    charsRemainingInSegment,
  };
}

/**
 * Format a concise, high-priority emergency SMS alert
 * @param {Object} alert
 * @param {string} alert.hazardType - 'DROUGHT'|'FLOOD'|'LOCUST_PEST'|'FROST'
 * @param {string} alert.severity - 'CRITICAL'|'HIGH'|'MODERATE'
 * @param {string} [alert.woredaName] - e.g., 'Adama'
 * @param {string} [alert.actionAm] - e.g., 'ሰብልዎን ዛሬውኑ ይሰብስቡ'
 * @param {string} [alert.actionOm] - e.g., 'Midhaan keessan har\'a sassaabaa'
 * @param {string} [alert.actionEn] - e.g., 'Harvest mature crops today'
 * @param {string} [alert.lang] - 'am'|'om'|'en'
 */
function formatEmergencySms({
  hazardType = 'DROUGHT',
  severity = 'HIGH',
  woredaName = 'Woreda',
  actionAm,
  actionOm,
  actionEn,
  lang = 'am',
}) {
  const shortcode = '*212#';

  if (lang === 'am') {
    const header = severity === 'CRITICAL' ? '[አስቸኳይ ማስጠንቀቂያ]' : '[የግብርና ማስጠንቀቂያ]';
    const hazardAmMap = {
      DROUGHT: 'ድርቅ/ዝናብ እጥረት',
      FLOOD: 'ከፍተኛ ጎርፍ',
      LOCUST_PEST: 'የአንበጣ/ተባይ መንጋ',
      FROST: 'ውርጭ አደጋ',
      VEGETATION_STRESS: 'የሰብል ድርቀት',
    };
    const hazardAm = hazardAmMap[hazardType] || 'የአየር አደጋ';
    const action = actionAm || 'ተገቢውን ጥንቃቄ ያድርጉ';

    // Keep under 134 chars (2 UCS-2 segments max)
    const text = `${header}\n${woredaName}፡ ${hazardAm}! ${action}። ለዝርዝር መረጃ ${shortcode} ይደውሉ።`;
    return {
      message: text,
      metrics: calculateSmsMetrics(text),
    };
  }

  if (lang === 'om') {
    const header = severity === 'CRITICAL' ? '[AKEAKKACHIISA CIKKAA]' : '[AKEAKKACHIISA QONNAA]';
    const hazardOmMap = {
      DROUGHT: 'Hongee cimaa',
      FLOOD: 'Balaa Lolaa',
      LOCUST_PEST: 'Hawaannisa',
      FROST: 'Balaa Cabbii',
      VEGETATION_STRESS: 'Gogiinsa Midhaanii',
    };
    const hazardOm = hazardOmMap[hazardType] || 'Balaa Qilleensaa';
    const action = actionOm || 'Ofeeggannoo taasisaa';

    // Keep under 153 chars (1 GSM segment)
    const text = `${header}\n${woredaName}: ${hazardOm}! ${action}. Odeeffannoof ${shortcode} bilbilaa.`;
    return {
      message: text,
      metrics: calculateSmsMetrics(text),
    };
  }

  // English fallback
  const header = severity === 'CRITICAL' ? '[URGENT ALERT]' : '[AGRI WARNING]';
  const action = actionEn || 'Take protective action';
  const text = `${header} ${woredaName}: ${hazardType} risk! ${action}. Dial ${shortcode} for info.`;

  return {
    message: text,
    metrics: calculateSmsMetrics(text),
  };
}

module.exports = {
  isUnicodeText,
  calculateSmsMetrics,
  formatEmergencySms,
};
