const AfricasTalking = require('africastalking');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const { calculateSmsMetrics, formatEmergencySms } = require('./smsFormatter');

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

/**
 * Send SMS via Africa's Talking gateway with segment budget tracking
 */
async function sendSms(to, message) {
  const recipients = Array.isArray(to) ? to : [to];
  const metrics = calculateSmsMetrics(message);

  logger.info(`[SMS Budget] Length: ${metrics.charCount} chars (${metrics.isUnicode ? 'UCS-2 / Unicode' : 'GSM 7-bit'}), Segments: ${metrics.segmentCount}, Recipients: ${recipients.length}`);

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
      return {
        success: true,
        count: recipients.length,
        metrics,
        gatewayResponse: response,
      };
    } catch (err) {
      logger.error(`[SMS Gateway Error] Failed sending to ${recipients.join(', ')}: ${err.message}`);
      throw err;
    }
  }

  // Local fallback if no gateway configured
  logger.info(`[SMS Dispatch Local Fallback] To: ${recipients.join(', ')} (Segments: ${metrics.segmentCount}) - "${message}"`);
  return {
    success: true,
    count: recipients.length,
    metrics,
    fallback: true,
  };
}

/**
 * Send structured emergency alert formatted according to Ethiopian language and character budget
 */
async function sendEmergencyAlert({ to, hazardType, severity, woredaName, actionAm, actionOm, actionEn, lang = 'am' }) {
  const { message, metrics: _metrics } = formatEmergencySms({
    hazardType,
    severity,
    woredaName,
    actionAm,
    actionOm,
    actionEn,
    lang,
  });

  return await sendSms(to, message);
}

module.exports = {
  sendSms,
  sendEmergencyAlert,
  calculateSmsMetrics,
  formatEmergencySms,
  smsService,
};

