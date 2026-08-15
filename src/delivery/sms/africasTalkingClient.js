const AfricasTalking = require('africastalking');
const env = require('../../config/env');
const logger = require('../../utils/logger');

let smsService = null;

try {
  if (env.AFRICAS_TALKING_API_KEY && env.AFRICAS_TALKING_USERNAME) {
    const at = AfricasTalking({
      apiKey: env.AFRICAS_TALKING_API_KEY,
      username: env.AFRICAS_TALKING_USERNAME,
    });
    smsService = at.SMS;
  }
} catch (err) {
  logger.warn(`Africa's Talking client notice: ${err.message}`);
}

// Send SMS via Africa's Talking gateway
async function sendSms(to, message) {
  const recipients = Array.isArray(to) ? to : [to];

  if (smsService && env.NODE_ENV === 'production') {
    return await smsService.send({
      to: recipients,
      message,
      from: env.AFRICAS_TALKING_SENDER_ID,
    });
  }

  // Development sandbox fallback
  logger.info(`[SMS Dispatch] To: ${recipients.join(', ')} - "${message}"`);
  return { success: true, count: recipients.length };
}

module.exports = {
  sendSms,
  smsService,
};
