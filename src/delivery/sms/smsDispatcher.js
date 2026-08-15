const { sendSms } = require('./africasTalkingClient');

// Multi-language alert templates (Amharic, Afaan Oromoo, English)
const TEMPLATES = {
  DROUGHT: {
    EN: (woreda, severity) =>
      `[AgriEtech Alert] Drought Warning for ${woreda}: Severity is ${severity}.`,
    AM: (woreda, _sev) => `[አግሪኢቴክ ማስጠንቀቂያ] በ${woreda} ወረዳ የድርቅ ስጋት ተከስቷል።`,
    OM: (woreda, _sev) =>
      `[AgriEtech Akeekkachiisa] Aanaa ${woreda} keessatti balaan ongeen mul'ateera.`,
  },
  FLOOD: {
    EN: (woreda, severity) =>
      `[AgriEtech Alert] Flood Warning for ${woreda}: Severity is ${severity}.`,
    AM: (woreda, _sev) => `[አግሪኢቴክ ማስጠንቀቂያ] በ${woreda} ወረዳ የጎርፍ አደጋ ስጋት አለ።`,
    OM: (woreda, _sev) => `[AgriEtech Akeekkachiisa] Aanaa ${woreda} keessatti balaan lolaa jira.`,
  },
  LOCUST: {
    EN: (woreda, _sev) => `[AgriEtech Alert] Desert Locust Swarm sighted near ${woreda}.`,
    AM: (woreda, _sev) => `[አግሪኢቴክ ማስጠንቀቂያ] በ${woreda} የአንበጣ መንጋ ተስተውሏል።`,
    OM: (woreda, _sev) =>
      `[AgriEtech Akeekkachiisa] Hawannisa gammoojjii naannoo ${woreda}tti mul'ateera.`,
  },
};

// Dispatch localized SMS alert
async function dispatchHazardAlertSms({
  phoneNumbers,
  hazardType,
  woredaName,
  severity = 'HIGH',
  language = 'EN',
}) {
  const hazardGroup = TEMPLATES[hazardType] || TEMPLATES.DROUGHT;
  const templateFn = hazardGroup[language] || hazardGroup.EN;
  const text = templateFn(woredaName, severity);

  return await sendSms(phoneNumbers, text);
}

module.exports = {
  dispatchHazardAlertSms,
  TEMPLATES,
};
