/**
 * Ethiopian Mobile Phone Number Canonicalization & Validation Utility
 * Supports Ethio Telecom (09...) and Safaricom Ethiopia (07...)
 */

/**
 * Normalizes an Ethiopian phone number to canonical E.164 format (+2519XXXXXXXX or +2517XXXXXXXX).
 * Returns null if input is falsy or cannot be parsed.
 */
function normalizeEthiopianPhone(input) {
  if (!input) return null;
  const str = input.toString().trim().replace(/[\s\-().]/g, '');
  if (!str) return null;

  // If already full E.164 format (+2519... or +2517...) with 13 chars
  if (/^\+251[79]\d{8}$/.test(str)) {
    return str;
  }

  // 09XXXXXXXX or 07XXXXXXXX (10 digits)
  if (/^0[79]\d{8}$/.test(str)) {
    return `+251${str.substring(1)}`;
  }

  // 2519XXXXXXXX or 2517XXXXXXXX (12 digits)
  if (/^251[79]\d{8}$/.test(str)) {
    return `+${str}`;
  }

  // 9XXXXXXXX or 7XXXXXXXX (9 digits without prefix)
  if (/^[79]\d{8}$/.test(str)) {
    return `+251${str}`;
  }

  // If general international phone number with valid E.164 pattern
  if (/^\+[1-9]\d{7,14}$/.test(str)) {
    return str;
  }

  return str;
}

/**
 * Validates whether the given string represents a valid Ethiopian mobile number.
 */
function isValidEthiopianPhone(input) {
  const normalized = normalizeEthiopianPhone(input);
  if (!normalized) return false;
  return /^\+251[79]\d{8}$/.test(normalized);
}

/**
 * Returns an array of search variants for database lookups to ensure backward compatibility
 * with existing stored formats (e.g. ['+251911234567', '0911234567', '251911234567']).
 */
function getPhoneLookupVariants(input) {
  if (!input) return [];
  const raw = input.toString().trim().replace(/[\s\-().]/g, '');
  const normalized = normalizeEthiopianPhone(raw);
  const variants = new Set();

  if (raw) variants.add(raw);
  if (normalized) {
    variants.add(normalized);
    if (normalized.startsWith('+251')) {
      const localPrefix = '0' + normalized.substring(4);
      variants.add(localPrefix);
      variants.add(normalized.substring(1)); // 2519...
    }
  }

  return Array.from(variants).filter(Boolean);
}

/**
 * Formats a phone number for user-friendly UI display (e.g. +251 91 123 4567).
 */
function formatPhoneForDisplay(input) {
  const normalized = normalizeEthiopianPhone(input);
  if (!normalized || !normalized.startsWith('+251')) {
    return input || '';
  }
  const code = normalized.substring(0, 4); // +251
  const prefix = normalized.substring(4, 6); // 91
  const part1 = normalized.substring(6, 9); // 123
  const part2 = normalized.substring(9); // 4567
  return `${code} ${prefix} ${part1} ${part2}`;
}

/**
 * Normalizes any Ethiopian phone number to a 12-digit standard MSISDN without '+'
 * (e.g. 251911234567 or 251711234567), required by SMSEthiopia and telecom SMS gateways.
 * Handles both Ethio Telecom (09) and Safaricom Ethiopia (07).
 */
function toEthiopianMsisdn(input) {
  if (!input) return '';
  const normalized = normalizeEthiopianPhone(input);
  if (normalized && normalized.startsWith('+251')) {
    return normalized.substring(1); // Strips the '+' leaving '2519...' or '2517...'
  }
  const digits = String(input).trim().replace(/\D/g, '');
  if (digits.startsWith('0') && (digits[1] === '9' || digits[1] === '7') && digits.length === 10) {
    return '251' + digits.substring(1);
  }
  if ((digits.startsWith('9') || digits.startsWith('7')) && digits.length === 9) {
    return '251' + digits;
  }
  return digits;
}

module.exports = {
  normalizeEthiopianPhone,
  isValidEthiopianPhone,
  getPhoneLookupVariants,
  formatPhoneForDisplay,
  toEthiopianMsisdn,
};
