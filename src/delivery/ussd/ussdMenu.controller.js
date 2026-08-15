// Handle interactive USSD session (*804#)
async function handleUssdSession(req, res, next) {
  try {
    const { text } = req.body || {};
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
      response = 'END Weather: Today 24°C, Sunny. Rain Probability: 15%.';
    } else if (step === '2') {
      response = 'END Drought Status: Normal (SPI: +0.4). Soil moisture adequate.';
    } else if (step === '3') {
      response = 'END Flood Status: Normal river flow. No active flood warnings.';
    } else if (step === '4') {
      response =
        inputs.length === 1
          ? 'CON Report Threat:\n1. Locust\n2. Fall Armyworm\n3. Crop Disease'
          : 'END Report submitted to local Development Agent.';
    } else if (step === '5') {
      response = 'END Language preference updated.';
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
