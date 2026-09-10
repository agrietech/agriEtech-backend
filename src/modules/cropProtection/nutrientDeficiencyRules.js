/**
 * Ethiopian Agricultural Nutrient Deficiency Diagnostics & Top-Dressing Protocols
 * Grounded in Ethiopian Soil Information System (EthioSIS) & EIAR Fertilizer Blends.
 */

const NUTRIENT_DEFICIENCIES = [
  {
    id: 'nitrogen_deficiency',
    nutrient: 'Nitrogen (N)',
    nutrientNameAm: 'ናይትሮጅን (N)',
    affectedLeaves: 'Older / Lower Leaves first (Mobile nutrient)',
    symptomPattern: 'V-shaped chlorosis beginning at leaf tip and progressing along the midrib',
    visualDescriptionEn: 'Pale yellowing starting from the tip of older lower leaves moving inward along the midrib in an inverted "V" shape. Leaf margins remain green initially. Stems become slender and stunted.',
    visualDescriptionAm: 'ከስር ባሉ የቆዩ ቅጠሎች ጫፍ ጀምሮ በቅጠሉ መሃል የጀርባ አጥንት መስመር በኩል ወደ ውስጥ ቢጫ እየሆነ የሚሄድ የተገለበጠ "V" ቅርጽ ያለው መገርጣት።',
    causesEn: 'Waterlogged vertisols (denitrification), leaching during heavy rains, sandy low-organic soils, or inadequate basal NPSB/Urea.',
    causesAm: 'የውሃ መተኛት (ኮትቻ አፈር)፣ ከፍተኛ ዝናብ ናይትሮጅን ሲያጥበው፣ ወይም በቂ የዩሪያ ማዳበሪያ ባለመጨመር።',
    correction: {
      fertilizerName: 'Urea (46% N)',
      fertilizerNameAm: 'ዩሪያ (46% ናይትሮጅን)',
      applicationType: 'Top-dressing / Side-dressing',
      ratePerHectare: '50 - 100 kg/ha (Split into 2 doses)',
      knapsackFoliarRescue: '200 - 300 g Urea per 16L knapsack (2% w/v foliar solution for emergency rescue)',
      timingEn: 'First split at tillering (30 days after planting) when soil is moist; second split before boot / tasseling stage.',
      timingAm: 'አፈሩ እርጥበት ባለበት ሰዓት የመጀመሪያውን ግማሽ ከተዘራ በ30 ቀናት በልምላሜ ወቅት፣ ሁለተኛውን ደግሞ ሰብሉ ከመደገኑ በፊት።',
      precautionsEn: 'Do NOT apply on dry crackled soil without rain or irrigation (causes ammonia volatilization). Incorporate into moist soil.'
    }
  },
  {
    id: 'phosphorus_deficiency',
    nutrient: 'Phosphorus (P)',
    nutrientNameAm: 'ፎስፈረስ (P)',
    affectedLeaves: 'Older / Lower Leaves first (Mobile nutrient)',
    symptomPattern: 'Purplish, reddish-bronze or dark green coloration on leaf margins and stems',
    visualDescriptionEn: 'Distinct purple to reddish-bronze discoloration along leaf margins and underside of veins, accompanied by stunted root development, delayed flowering, and thin stalks.',
    visualDescriptionAm: 'በቅጠል ጠርዞች እና በግንድ ላይ ወይን-ጠጅ (ሐምራዊ) ወይም ቀይ-ቡናማ ቀለም መቀየር፣ የስር እድገት መገታት እና የሰብል መኮሰስ።',
    causesEn: 'Acidic Nitisols (pH < 5.5) in Western Ethiopia (Wollega, Jimma) fixing phosphate into insoluble iron/aluminum phosphates; cold wet soils.',
    causesAm: 'በምዕራብ ኢትዮጵያ ባሉ አሲዳማ አፈሮች (pH < 5.5) ፎስፈረስ በአፈር ስለሚታሰር ተክሉ ሊወስደው አይችልም።',
    correction: {
      fertilizerName: 'NPSB + Agricultural Lime (CaCO3)',
      fertilizerNameAm: 'ኤን ፒ ኤስ ቢ (NPSB) + የግብርና ኖራ (Lime)',
      applicationType: 'Basal banding at sowing + Agricultural Lime for acidic soils',
      ratePerHectare: '100 - 150 kg NPSB/ha at planting + 2 - 3 tonnes Lime/ha on acid soils every 3 years',
      knapsackFoliarRescue: '150 - 200 g Mono-Ammonium Phosphate (MAP 12-61-0) per 16L knapsack sprayer',
      timingEn: 'Band placed 5 cm below and 5 cm to the side of seeds at planting for immediate root interception.',
      timingAm: 'በመዝሪያ ወቅት ከዘሩ በታች 5 ሳ.ሜ ርቀት ላይ በማስቀመጥ በስሩ ቶሎ እንዲወሰድ ማድረግ።',
      precautionsEn: 'Broadcast P on acidic soils gets rapidly fixed. Always use localized band placement.'
    }
  },
  {
    id: 'potassium_deficiency',
    nutrient: 'Potassium (K)',
    nutrientNameAm: 'ፖታሺየም (K)',
    affectedLeaves: 'Older / Lower Leaves first',
    symptomPattern: 'Marginal scorching, leaf tip firing, and chlorosis on outer edges',
    visualDescriptionEn: 'Yellowing and necrotic browning (marginal burn/scorch) along outer edges of older leaves. Leaves appear burnt at margins while the center stays green. Stalks become weak and prone to lodging.',
    visualDescriptionAm: 'የቆዩ ቅጠሎች የውጭ ጠርዝ እንደ እሳት የተቃጠለ የሚመስል መድረቅና መቃጠል፤ ግንዱ ደካማ ሆኖ በቀላሉ መውደቅ (Lodging)።',
    causesEn: 'Intensive continuous cereal harvesting without straw recycling; highly leached sandy soils.',
    causesAm: 'የሰብል ገለባን ከአፈር ላይ አሟጦ ማስወጣት እና በአሸዋማ አፈር ላይ ተደጋጋሚ እርሻ ማካሄድ።',
    correction: {
      fertilizerName: 'Muriate of Potash (MOP - KCl 60% K2O) or Potassium Sulfate (SOP)',
      fertilizerNameAm: 'ፖታሽ ማዳበሪያ (K2O)',
      applicationType: 'Basal or Early Top-dressing',
      ratePerHectare: '50 - 75 kg/ha',
      knapsackFoliarRescue: '150 g Potassium Sulfate (SOP) per 16L knapsack sprayer',
      timingEn: 'Apply at sowing or early tillering.',
      timingAm: 'በመዝሪያ ወቅት ወይም ሰብሉ ገና እያቆጠቆጠ ሳለ በአፈር ውስጥ መስጠት።',
      precautionsEn: 'Avoid excessive application in saline soils.'
    }
  },
  {
    id: 'zinc_deficiency',
    nutrient: 'Zinc (Zn)',
    nutrientNameAm: 'ዚንክ (Zn)',
    affectedLeaves: 'Middle to Upper Young Leaves (Immobile nutrient)',
    symptomPattern: 'Interveinal broad bleached white bands on both sides of midrib ("White Bud" in maize)',
    visualDescriptionEn: 'Broad white or bleached yellow chlorotic bands developing on either side of the midrib between base and tip of expanding young leaves. Shortened internodes producing a stunted rosette appearance.',
    visualDescriptionAm: 'በለጋ ቅጠሎች ላይ በመሃከለኛ አጥንት ግራና ቀኝ ነጭ የረከረከ መስመር መውጣት (በበቆሎ "ነጭ ቡቃያ" / White Bud)፤ የእድገት መኮሰስ።',
    causesEn: 'Widespread in Ethiopian soils (over 60% of Ethiopian soils are zinc-deficient per EthioSIS); high pH calcareous alkaline soils.',
    causesAm: 'በኢትዮጵያ ከ60% በላይ አፈር ላይ የዚንክ እጥረት አለ (በኢትዮሲስ ጥናት)፤ በተለይ ኖራማና አልካላይን አፈሮች።',
    correction: {
      fertilizerName: 'NPSB + Zinc Sulfate (ZnSO4 21%)',
      fertilizerNameAm: 'ዚንክ ሰልፌት (Zinc Sulfate) / ዚንክ የተቀላቀለበት NPSB',
      applicationType: 'Zn-blended basal fertilizer + Foliar rescue spray',
      ratePerHectare: '100 kg Zn-enriched NPSB/ha basal OR 10 - 15 kg ZnSO4/ha to soil',
      knapsackFoliarRescue: '50 - 60 g Zinc Sulfate heptahydrate + 30 g hydrated lime per 16L knapsack sprayer',
      timingEn: 'Foliar spray at 3-4 weeks after emergence if white chlorotic bands appear.',
      timingAm: 'ሰብሉ ከበቀለ ከ3-4 ሳምንት በኋላ ነጭ ምልክቱ በቅጠሉ ላይ ከታየ በቅጠሉ ላይ መርጨት።',
      precautionsEn: 'Neutralize zinc sulfate solution with a small amount of lime to avoid acidic leaf burning.'
    }
  },
  {
    id: 'iron_deficiency',
    nutrient: 'Iron (Fe)',
    nutrientNameAm: 'ብረት / አይረን (Fe)',
    affectedLeaves: 'Youngest Upper Leaves First (Highly Immobile)',
    symptomPattern: 'Sharp interveinal chlorosis (veins remain distinctly dark green)',
    visualDescriptionEn: 'Distinct striped pattern where entire leaf blade turns bright ivory yellow or white, while veins remain sharply dark green. In severe deficiency, entire young leaves turn completely paper white.',
    visualDescriptionAm: 'በአዳዲስ ለጋ ቅጠሎች ላይ ቅጠሉ ሙሉ በሙሉ ቢጫ ወይም ነጭ ሲሆን የቅጠሉ ደም ስሮች ግን ጥቁር አረንጓዴ ሆነው የሚቀሩበት አስገራሚ ምልክት።',
    causesEn: 'Calcareous soils with high pH (>7.8), poor drainage, high bicarbonate in irrigation water restricting iron uptake.',
    causesAm: 'ከፍተኛ ፒኤች (pH > 7.8) ባላቸው ኖራማ አፈሮች ላይ ወይም የውሃ መተኛት ሲኖር።',
    correction: {
      fertilizerName: 'Chelated Iron (Fe-EDDHA / Fe-EDTA 6%)',
      fertilizerNameAm: 'ቺሌትድ አይረን (Iron Chelate)',
      applicationType: 'Foliar spray rescue',
      ratePerHectare: '2.0 - 3.0 kg/ha foliar spray',
      knapsackFoliarRescue: '30 - 40 g Fe-EDTA/Fe-EDDHA per 16L knapsack sprayer',
      timingEn: 'Spray immediately upon spotting interveinal chlorosis in early vegetative growth; repeat in 10 days.',
      timingAm: 'ምልክቱ በአዳዲስ ቅጠሎች ላይ እንደታየ ወዲያውኑ በቅጠል መርጨት እና ከ10 ቀናት በኋላ መድገም።',
      precautionsEn: 'Soil application of non-chelated iron sulfate is ineffective on high pH soils because iron precipitates instantly.'
    }
  },
  {
    id: 'sulfur_deficiency',
    nutrient: 'Sulfur (S)',
    nutrientNameAm: 'ሰልፈር (S)',
    affectedLeaves: 'Upper Youngest Leaves First (Distinguishes from Nitrogen)',
    symptomPattern: 'Uniform light green to pale yellowing across entire leaf surface without distinct vein pattern',
    visualDescriptionEn: 'Upper young leaves turn uniform pale yellow while lower older leaves remain green. Plants are spindly with small thin stems and delayed crop maturity.',
    visualDescriptionAm: 'ከላይ ያሉት ለጋ ቅጠሎች ሙሉ በሙሉ ወደ ፈዛዛ ቢጫነት ሲቀየሩ የስር ቅጠሎች ግን አረንጓዴ ሆነው ይቆያሉ (ከናይትሮጅን እጥረት የሚለየው በዚህ ነው)።',
    causesEn: 'Low organic matter soils, frequent use of high-analysis sulfur-free fertilizers (like DAP and plain Urea), heavy leaching.',
    causesAm: 'የኦርጋኒክ ቁስ ማነስ እና ለረጅም ጊዜ ሰልፈር የሌላቸውን ማዳበሪያዎች (እንደ ዳፕ እና ዩሪያ ብቻ) መጠቀም።',
    correction: {
      fertilizerName: 'NPS / NPSB Fertilizer or Ammonium Sulfate',
      fertilizerNameAm: 'ሰልፈር ያለበት NPS / NPSB ወይም አሞኒየም ሰልፌት',
      applicationType: 'Basal or Top-dress',
      ratePerHectare: '100 kg NPSB/ha (contains ~7% S) or 50 kg Ammonium Sulfate/ha',
      knapsackFoliarRescue: '100 g Ammonium Sulfate per 16L knapsack sprayer',
      timingEn: 'At sowing as basal NPSB, or foliar rescue if spotted.',
      timingAm: 'በመዝሪያ ወቅት ሰልፈር ያለበትን NPSB በመጨመር ወይም ምልክቱ ሲታይ በአሞኒየም ሰልፌት መርጨት።',
      precautionsEn: 'Ethiopian soils widely respond to S-formulated fertilizers.'
    }
  }
];

function diagnoseDeficiencySymptoms({ leafPosition = 'older', pattern = 'v_shaped', soilPh = 6.5, cropType = 'Maize' }) {
  let matched = NUTRIENT_DEFICIENCIES[0];

  const pos = (leafPosition || '').toLowerCase();
  const pat = (pattern || '').toLowerCase();

  if (pos.includes('young') || pos.includes('upper')) {
    if (pat.includes('interveinal') || pat.includes('vein')) {
      matched = NUTRIENT_DEFICIENCIES.find(d => d.id === 'iron_deficiency');
    } else if (pat.includes('white') || pat.includes('band') || pat.includes('stripe')) {
      matched = NUTRIENT_DEFICIENCIES.find(d => d.id === 'zinc_deficiency');
    } else {
      matched = NUTRIENT_DEFICIENCIES.find(d => d.id === 'sulfur_deficiency');
    }
  } else {
    // Older / lower leaves
    if (pat.includes('purple') || pat.includes('bronze') || pat.includes('red')) {
      matched = NUTRIENT_DEFICIENCIES.find(d => d.id === 'phosphorus_deficiency');
    } else if (pat.includes('margin') || pat.includes('edge') || pat.includes('scorch') || pat.includes('burn')) {
      matched = NUTRIENT_DEFICIENCIES.find(d => d.id === 'potassium_deficiency');
    } else {
      matched = NUTRIENT_DEFICIENCIES.find(d => d.id === 'nitrogen_deficiency');
    }
  }

  return {
    cropType,
    soilPh,
    diagnosedDeficiency: matched,
    recommendationSummaryEn: `Targeted correction for ${matched.nutrient}: Apply ${matched.correction.fertilizerName} via ${matched.correction.applicationType}. Recommended rate: ${matched.correction.ratePerHectare}. Emergency foliar rate: ${matched.correction.knapsackFoliarRescue}.`,
    recommendationSummaryAm: `ለ${matched.nutrientNameAm} እጥረት መፍትሄ፡ ${matched.correction.fertilizerNameAm} በ${matched.correction.ratePerHectare} መጠን ይጠቀሙ። አስቸኳይ የቅጠል ርጭት፡ ${matched.correction.knapsackFoliarRescue}።`
  };
}

module.exports = {
  NUTRIENT_DEFICIENCIES,
  diagnoseDeficiencySymptoms
};
