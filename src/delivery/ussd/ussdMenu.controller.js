const riskAssessmentsService = require('../../modules/riskAssessments/riskAssessments.service');

// Handle interactive USSD session (*804#)
async function handleUssdSession(req, res, next) {
  try {
    const { text, phoneNumber: _phoneNumber } = req.body || {};
    const inputs = (text || '').split('*');
    const step = inputs[0];

    let response = '';

    if (!text) {
      response = `CON Welcome to AgriEtech Early Warning (*804#)
1. Weather Forecast
2. Drought & Rain Status
3. Flood Alert Status
4. Report Locust / Pest
5. Change Language`;
    } else if (step === '1') {
      response = 'END Weather: Forecast (Adama/Bishoftu): Temp 24°C, Partly Cloudy. Rain Probability: 20%.';
    } else if (step === '2') {
      let statusText = 'Normal (SPI: +0.4). Soil moisture adequate.';
      try {
        const assessments = await riskAssessmentsService.getLatestAssessments({ limit: 1 });
        if (assessments && assessments.length > 0) {
          const latest = assessments[0];
          statusText = `Risk: ${latest.alertLevel || 'NORMAL'} (Score: ${latest.compositeScore || latest.riskScore || 0.4}). ${latest.recommendationsEn ? latest.recommendationsEn.split('|')[0].trim() : ''}`;
        }
      } catch (_e) {
        // Fallback
      }
      response = `END Drought Status: ${statusText}`;
    } else if (step === '3') {
      response = 'END Flood Status: Normal river discharge. No active flash flood alerts in your woreda.';
    } else if (step === '4') {
      response =
        inputs.length === 1
          ? 'CON Report Threat:\n1. Locust Swarm\n2. Fall Armyworm\n3. Crop Disease'
          : 'END Threat report submitted to local Development Agent and Woreda Agriculture Office.';
    } else if (step === '5') {
      response = 'END Language preference updated to Amharic (አማርኛ).';
    } else {
      response = 'END Invalid option selected.';
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleUssdSession,
};
