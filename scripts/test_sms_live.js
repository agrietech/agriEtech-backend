const AfricasTalking = require('africastalking');
const env = require('../src/config/env');

console.log('Testing Africa\'s Talking SMS Gateway...');
console.log('Username:', env.AFRICAS_TALKING_USERNAME);
console.log('API Key configured:', env.AFRICAS_TALKING_API_KEY ? 'YES (' + env.AFRICAS_TALKING_API_KEY.substring(0, 10) + '...)' : 'NO');

const at = AfricasTalking({
  apiKey: env.AFRICAS_TALKING_API_KEY,
  username: env.AFRICAS_TALKING_USERNAME,
});

async function run() {
  try {
    const result = await at.SMS.send({
      to: ['+251924276862'],
      message: '[AgriEtech Test] Early Warning SMS System verified successfully for +251924276862.',
    });
    console.log('\n--- SUCCESS RESPONSE FROM AFRICA\'S TALKING ---');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.log('\n--- ERROR / NOTICE FROM AFRICA\'S TALKING ---');
    console.error(err.message || err);
  }
}

run();
