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

  if (smsService) {
    try {
      const sendOptions = {
        to: recipients,
        message,
      };
      if (env.AFRICAS_TALKING_USERNAME !== 'sandbox' && env.AFRICAS_TALKING_SENDER_ID) {
        sendOptions.from = env.AFRICAS_TALKING_SENDER_ID;
      }
      const response = await smsService.send(sendOptions);
      logger.info(`[SMS Dispatch Success] Gateway response: ${JSON.stringify(response)}`);
      return { success: true, count: recipients.length, gatewayResponse: response };
    } catch (err) {
      logger.error(`[SMS Gateway Error] Failed sending to ${recipients.join(', ')}: ${err.message}`);
      throw err;
    }
  }

  // Local fallback if no gateway configured
  logger.info(`[SMS Dispatch Local Fallback] To: ${recipients.join(', ')} - "${message}"`);
  return { success: true, count: recipients.length, fallback: true };
}

module.exports = {
  sendSms,
  smsService,
};
