/**
 * Ethiopian Crop Seed Rate, Plant Spacing & Basal Nutrition Calculator
 * Standardized according to Ethiopian Institute of Agricultural Research (EIAR) Crop Production Manuals.
 */

const ETHIOPIAN_CROP_AGRONOMY = [
  {
    cropId: 'teff',
    cropNameEn: 'Teff (Eragrostis tef)',
    cropNameAm: 'ጤፍ',
    recommendedVarieties: ['Quncho (DZ-Cr-387)', 'Kora', 'Dagim', 'Bora', 'Boset'],
    rowPlantingSeedRateKgHa: 5.0, // Reduced seed rate for row planting
    broadcastingSeedRateKgHa: 15.0, // Traditional broadcast rate
    rowSpacingCm: 20,
    plantSpacingCm: 5,
    plantingDepthCm: '0.5 - 1.0 cm (Very shallow, press lightly into firm seedbed)',
    targetPlantPopulationHa: 1200000,
    basalNpsbKgHa: 100, // Basal NPSB at planting
    topDressUreaKgHa: 50, // Top-dress at tillering (30 days)
    plantingWindowEn: 'Main Meher season: Early to Mid July (highlands) to late July (lowlands)',
    plantingWindowAm: 'የመኸር ወቅት፡ ከሐምሌ መጀመሪያ እስከ መጨረሻ',
    specialInstructionsEn: 'Teff requires a very firm, finely pulverized seedbed. Roll or press soil after sowing to prevent seed burial beyond 1 cm.',
    specialInstructionsAm: 'ጤፍ በጣም የደቀቀ እና የተደለደለ አፈር ይፈልጋል። ዘሩ ከ1 ሳ.ሜ በላይ እንዳይሰምጥ ከተዘራ በኋላ ማሳውን በስሱ ማሸት ወይም መርገጥ ያስፈልጋል።'
  },
  {
    cropId: 'wheat',
    cropNameEn: 'Bread Wheat (Triticum aestivum)',
    cropNameAm: 'ስንዴ',
    recommendedVarieties: ['Kakaba', 'Ogolcho', 'Danda\'a', 'Kingbird', 'Hidase'],
    rowPlantingSeedRateKgHa: 125.0,
    broadcastingSeedRateKgHa: 150.0,
    rowSpacingCm: 20,
    plantSpacingCm: 5,
    plantingDepthCm: '4.0 - 5.0 cm',
    targetPlantPopulationHa: 2500000,
    basalNpsbKgHa: 100,
    topDressUreaKgHa: 100, // Split 50kg at tillering, 50kg at stem elongation
    plantingWindowEn: 'Late June to Mid July depending on onset of Meher rainfall',
    plantingWindowAm: 'ከሰኔ መጨረሻ እስከ ሐምሌ አጋማሽ',
    specialInstructionsEn: 'Treat certified seed with fungicide seed dressing to prevent seedling damping-off and smuts.',
    specialInstructionsAm: 'የተመሰከረለት ዘር በፀረ-ፈንገስ የታሸገ መሆኑን ያረጋግጡ ወይም ከመዝራት በፊት በኬሚካል ይለብሱ።'
  },
  {
    cropId: 'maize',
    cropNameEn: 'Maize (Zea mays)',
    cropNameAm: 'በቆሎ',
    recommendedVarieties: ['BH-661 (Highland)', 'BH-546 (Mid-altitude)', 'Limu', 'Pioneer 30G19', 'Melkassa 1-4 (Drought tolerant)'],
    rowPlantingSeedRateKgHa: 25.0,
    broadcastingSeedRateKgHa: 30.0,
    rowSpacingCm: 75,
    plantSpacingCm: 25,
    plantingDepthCm: '5.0 - 7.0 cm',
    targetPlantPopulationHa: 53333, // 10000 / (0.75 * 0.25)
    basalNpsbKgHa: 100,
    topDressUreaKgHa: 150, // Split: 50kg knee-high (V6), 100kg before tasseling
    plantingWindowEn: 'April to May in sub-humid/highlands; late May in central rift valley',
    plantingWindowAm: 'ከሚያዚያ እስከ ግንቦት መጨረሻ',
    specialInstructionsEn: 'Maintain single plant per hill at 25 cm spacing along 75 cm rows. Thin excess seedlings 2 weeks after emergence.',
    specialInstructionsAm: 'በረድፍ መካከል 75 ሳ.ሜ፣ በጉድጓድ መካከል 25 ሳ.ሜ በማድረግ በአንድ ጉድጓድ አንድ ጠንካራ ቡቃያ ብቻ እንዲያድግ ያድርጉ።'
  },
  {
    cropId: 'barley',
    cropNameEn: 'Food & Malting Barley (Hordeum vulgare)',
    cropNameAm: 'ገብስ',
    recommendedVarieties: ['HB-1307', 'Traveler (Malt)', 'Grace (Malt)', 'Cross-41'],
    rowPlantingSeedRateKgHa: 100.0,
    broadcastingSeedRateKgHa: 125.0,
    rowSpacingCm: 20,
    plantSpacingCm: 5,
    plantingDepthCm: '3.0 - 5.0 cm',
    targetPlantPopulationHa: 2200000,
    basalNpsbKgHa: 100,
    topDressUreaKgHa: 50,
    plantingWindowEn: 'Mid June to Early July in highland frost-prone plateaus',
    plantingWindowAm: 'ከሰኔ አጋማሽ እስከ ሐምሌ መጀመሪያ',
    specialInstructionsEn: 'For malting barley, keep nitrogen moderate to maintain grain protein below 11.5% for brewery standards.',
    specialInstructionsAm: 'የቢራ ገብስ ከሆነ የፕሮቲን መጠኑ እንዳይበዛ ናይትሮጅን (ዩሪያ) ከመጠን በላይ አይጨምሩ።'
  },
  {
    cropId: 'sorghum',
    cropNameEn: 'Sorghum (Sorghum bicolor)',
    cropNameAm: 'ማሽላ',
    recommendedVarieties: ['Melkam', 'Teshale', 'Chiro', 'Argiti', 'Meko'],
    rowPlantingSeedRateKgHa: 10.0,
    broadcastingSeedRateKgHa: 15.0,
    rowSpacingCm: 75,
    plantSpacingCm: 15,
    plantingDepthCm: '3.0 - 4.0 cm',
    targetPlantPopulationHa: 88888, // 10000 / (0.75 * 0.15)
    basalNpsbKgHa: 100,
    topDressUreaKgHa: 50,
    plantingWindowEn: 'April to early May for long-season varieties; June for early-maturing Melkam',
    plantingWindowAm: 'ከሚያዚያ እስከ ሰኔ መጀመሪያ',
    specialInstructionsEn: 'Extremely drought resilient. Thin seedlings to 1 plant every 15 cm within 3 weeks of emergence to prevent moisture stress.',
    specialInstructionsAm: 'ድርቅን በደንብ ይቋቋማል፤ በረድፍ ውስጥ በ15 ሳ.ሜ ርቀት አንድ ጠንካራ ቡቃያ ብቻ በማስቀረት የቀረውን ይንቀሉ።'
  },
  {
    cropId: 'faba_bean',
    cropNameEn: 'Faba Bean / Broad Bean (Vicia faba)',
    cropNameAm: 'ባቄላ',
    recommendedVarieties: ['Gebelcho', 'Tumsa', 'Degaga', 'Walki', 'Dosha'],
    rowPlantingSeedRateKgHa: 160.0,
    broadcastingSeedRateKgHa: 200.0,
    rowSpacingCm: 40,
    plantSpacingCm: 10,
    plantingDepthCm: '5.0 - 8.0 cm',
    targetPlantPopulationHa: 250000, // 10000 / (0.4 * 0.1)
    basalNpsbKgHa: 100,
    topDressUreaKgHa: 0, // Inoculated legume fixes atmospheric nitrogen!
    plantingWindowEn: 'Mid June to early July across cool highlands',
    plantingWindowAm: 'ከሰኔ አጋማሽ እስከ ሐምሌ መጀመሪያ',
    specialInstructionsEn: 'Legumes fix their own nitrogen via symbiotic Rhizobium leguminosarum bacteria. Inoculate seed with Bio-fertilizer (Rhizobium) instead of applying synthetic Urea.',
    specialInstructionsAm: 'ባቄላ ናይትሮጅንን ከአየር ስለሚስብ ዩሪያ ማዳበሪያ አያስፈልገውም፤ ይልቁንስ ባዮ-ማዳበሪያ (Rhizobium) ከዘሩ ጋር አዋህደው ይዝሩ።'
  }
];

/**
 * Convert various area units to Hectares
 * 1 Timad (ጭማድ) = 0.25 Hectare (2,500 m²)
 * 1 Boy (ቦይ) = 0.0625 Hectare (625 m²)
 * 1 Hectare = 10,000 m² = 4 Timad
 */
function convertToHectares(areaValue, unit = 'HECTARES') {
  const cleanUnit = (unit || 'HECTARES').toUpperCase().trim();
  const val = parseFloat(areaValue) || 1.0;

  switch (cleanUnit) {
    case 'TIMAD':
    case 'TIMADS':
    case 'ጭማድ':
      return val * 0.25;
    case 'BOY':
    case 'ቦይ':
      return val * 0.0625;
    case 'SQM':
    case 'M2':
    case 'SQUARE_METERS':
      return val / 10000;
    case 'HECTARES':
    case 'HECTARE':
    case 'HA':
    default:
      return val;
  }
}

/**
 * Calculate Seed Rate, Planting Density and Fertilizer Requirements
 */
function calculateSeedRequirements({ cropId, areaValue = 1, areaUnit = 'HECTARES', plantingMethod = 'ROW' }) {
  const targetCrop = ETHIOPIAN_CROP_AGRONOMY.find(c => 
    c.cropId === cropId.toLowerCase() || c.cropNameEn.toLowerCase().includes(cropId.toLowerCase())
  ) || ETHIOPIAN_CROP_AGRONOMY[0];

  const areaHa = convertToHectares(areaValue, areaUnit);
  const isRow = (plantingMethod || 'ROW').toUpperCase() === 'ROW';

  const baseSeedRate = isRow ? targetCrop.rowPlantingSeedRateKgHa : targetCrop.broadcastingSeedRateKgHa;
  const totalSeedKg = baseSeedRate * areaHa;
  const totalSeedBags50kg = (totalSeedKg / 50).toFixed(1);

  // Plant population
  const totalPlants = Math.round(targetCrop.targetPlantPopulationHa * areaHa);

  // Fertilizer needs
  const totalNpsbKg = targetCrop.basalNpsbKgHa * areaHa;
  const totalNpsbBags50kg = (totalNpsbKg / 50).toFixed(1);

  const totalUreaKg = targetCrop.topDressUreaKgHa * areaHa;
  const totalUreaBags50kg = (totalUreaKg / 50).toFixed(1);

  return {
    crop: {
      id: targetCrop.cropId,
      nameEn: targetCrop.cropNameEn,
      nameAm: targetCrop.cropNameAm,
      recommendedVarieties: targetCrop.recommendedVarieties
    },
    inputArea: {
      value: areaValue,
      unit: areaUnit,
      hectaresEquivalent: parseFloat(areaHa.toFixed(3)),
      timadEquivalent: parseFloat((areaHa * 4).toFixed(2))
    },
    plantingMethod: isRow ? 'ROW_PLANTING' : 'BROADCASTING',
    seedPlan: {
      ratePerHaKg: baseSeedRate,
      totalSeedRequiredKg: parseFloat(totalSeedKg.toFixed(1)),
      bags50kg: totalSeedBags50kg,
      plantingDepth: targetCrop.plantingDepthCm,
      geometry: isRow ? {
        rowSpacingCm: targetCrop.rowSpacingCm,
        plantSpacingCm: targetCrop.plantSpacingCm,
        estimatedTotalPlants: totalPlants,
        plantsPerHa: targetCrop.targetPlantPopulationHa
      } : {
        type: 'BROADCAST_UNIFORM',
        estimatedTotalPlants: totalPlants,
        plantsPerHa: targetCrop.targetPlantPopulationHa
      }
    },
    fertilizerPlan: {
      basalNpsb: {
        product: 'NPSB (Nitrogen-Phosphorus-Sulfur-Boron)',
        ratePerHaKg: targetCrop.basalNpsbKgHa,
        totalRequiredKg: parseFloat(totalNpsbKg.toFixed(1)),
        bags50kg: totalNpsbBags50kg,
        timingEn: 'Band placed 5 cm below and 5 cm to side of seed at planting',
        timingAm: 'በመዝሪያ ወቅት ከዘሩ ስር 5 ሳ.ሜ ርቀት ላይ በማስቀመጥ'
      },
      topDressUrea: {
        product: 'Urea (46% Nitrogen)',
        ratePerHaKg: targetCrop.topDressUreaKgHa,
        totalRequiredKg: parseFloat(totalUreaKg.toFixed(1)),
        bags50kg: totalUreaBags50kg,
        timingEn: targetCrop.topDressUreaKgHa === 0 ? 'Not required for legumes (Rhizobium fixes nitrogen)' : 'Split apply at 30 days after sowing and before boot/tassel stage',
        timingAm: targetCrop.topDressUreaKgHa === 0 ? 'ለባቄላ ዩሪያ አያስፈልግም (ናይትሮጅን ራሱ ያመነጫል)' : 'ከተዘራ በ30ኛው ቀንና ሰብሉ ከመደገኑ በፊት በሁለት ተከፍሎ የሚሰጥ'
      }
    },
    agronomicAdvice: {
      plantingWindowEn: targetCrop.plantingWindowEn,
      plantingWindowAm: targetCrop.plantingWindowAm,
      specialInstructionsEn: targetCrop.specialInstructionsEn,
      specialInstructionsAm: targetCrop.specialInstructionsAm
    }
  };
}

module.exports = {
  ETHIOPIAN_CROP_AGRONOMY,
  convertToHectares,
  calculateSeedRequirements
};
