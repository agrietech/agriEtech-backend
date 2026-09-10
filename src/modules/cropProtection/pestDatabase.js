/**
 * Ethiopian Agricultural Pest Database & Economic Threshold (ETL) Advisor
 * Grounded in Ethiopian Ministry of Agriculture (MoA) and FAO Integrated Pest Management (IPM) guidelines.
 */

const ETHIOPIAN_PEST_REGISTRY = [
  {
    id: 'fall_armyworm',
    scientificName: 'Spodoptera frugiperda',
    commonNameEn: 'Fall Armyworm (FAW)',
    commonNameAm: 'የአሜሪካ መጤ ተምች (FAW)',
    commonNameOm: 'Bocoyye / Dhummuugaa',
    pestType: 'Insect (Lepidoptera: Noctuidae)',
    targetCrops: ['Maize', 'Sorghum', 'Wheat', 'Millet'],
    etlGuidelines: {
      seedlingStageThreshold: 20, // % of plants showing damage at early whorl
      midWhorlThreshold: 40, // % of plants showing damage at late whorl
      tasselingThreshold: 10, // % plants infested near tasseling/ear formation
      unit: '% of sampled plants with fresh whorl damage / frass',
      assessmentInstruction: 'Scout 20 consecutive plants in 5 separate locations (100 plants total). Count plants with fresh frass (sawdust-like excrement) and windowpaning in the whorl.'
    },
    identificationKeys: [
      'Inverted white "Y" shape on the dark head capsule of mature larvae',
      'Four elevated dark spots arranged in a square on the 8th abdominal segment',
      'Extensive sawdust-like frass (droppings) accumulated deep in the whorl'
    ],
    pesticides: [
      {
        tradeName: 'Ampligo 150 ZC',
        activeIngredient: 'Chlorantraniliprole 100 g/L + Lambda-cyhalothrin 50 g/L',
        type: 'Synthetic Dual-Action Insecticide',
        ratePerHa: '0.2 - 0.3 L/ha',
        ratePer16LKnapsack: '15 - 20 mL per 16L knapsack sprayer',
        timing: 'Spray directly into the funnel/whorl late afternoon or early morning.',
        phiDays: 7,
        rainfastnessHours: 2,
        ppeRequired: ['Gloves', 'Respirator mask', 'Eye goggles', 'Boots']
      },
      {
        tradeName: 'Radiant 120 SC',
        activeIngredient: 'Spinetoram 120 g/L',
        type: 'Bio-rational Spinosyn (Low toxicity to beneficials)',
        ratePerHa: '0.15 - 0.2 L/ha',
        ratePer16LKnapsack: '10 - 15 mL per 16L knapsack sprayer',
        timing: 'Target 1st and 2nd instar larvae before they burrow deep inside the whorl.',
        phiDays: 3,
        rainfastnessHours: 2,
        ppeRequired: ['Gloves', 'Goggles']
      },
      {
        tradeName: 'Neem Seed Kernel Extract (5%)',
        activeIngredient: 'Azadirachtin (Botanical)',
        type: 'Organic Bio-Pesticide',
        ratePerHa: '500 g crushed neem seed powder in 10 L water',
        ratePer16LKnapsack: '800 g neem seed aqueous extract per 16L knapsack',
        timing: 'Apply weekly to suppress egg hatching and feeding of young instars.',
        phiDays: 0,
        rainfastnessHours: 1,
        ppeRequired: ['Basic cotton clothing']
      }
    ],
    culturalAndBiocontrol: [
      {
        method: 'Sand and Wood Ash Funnel Application',
        descriptionEn: 'Drop a pinch of dry fine sand mixed with wood ash (1:1 ratio) directly into the maize whorl. Desiccates young caterpillars through abrasion.',
        descriptionAm: 'የእንጨት አመድ እና ደረቅ አሸዋ በእኩል መጠን ቀላቅሎ በበቆሎ እምብርት ውስጥ መጨመር ተምቹን ያደርቃል።'
      },
      {
        method: 'Push-Pull Technology',
        descriptionEn: 'Intercrop maize with Desmodium (repels FAW moths) and plant Napier grass along field borders (traps egg-laying moths).',
        descriptionAm: 'በቆሎን ከደስሞዲየም እና ባና ሳር ጋር በፑሽ-ፑል (Push-Pull) ቴክኖሎጂ ማጣመር።'
      },
      {
        method: 'Handpicking of Egg Masses & Larvae',
        descriptionEn: 'Crush hairy cream-colored egg masses found on leaf undersides and manually remove larvae during early vegetative stages in smallholder plots.',
        descriptionAm: 'በቅጠል ስር የተጣሉ ነጭ የእንቁላል ክምችቶችን በእጅ እየፈጠፈጡ ማጥፋት።'
      }
    ]
  },
  {
    id: 'african_armyworm',
    scientificName: 'Spodoptera exempta',
    commonNameEn: 'African Armyworm',
    commonNameAm: 'ጥቁር አፍሪካዊ ተምች',
    commonNameOm: 'Bocoyye Gurraacha',
    pestType: 'Insect (Lepidoptera: Noctuidae)',
    targetCrops: ['Teff', 'Wheat', 'Barley', 'Pasture / Grasslands'],
    etlGuidelines: {
      seedlingStageThreshold: 3, // 3 larvae per square meter in teff/cereals
      midWhorlThreshold: 5, // 5 larvae per square meter
      tasselingThreshold: 10,
      unit: 'larvae per square meter',
      assessmentInstruction: 'Throw a 1m x 1m quadrant in 5 random field locations. Count marching gregarious black caterpillars on the soil and lower crop stems.'
    },
    identificationKeys: [
      'Velvety black body with thin pale yellow longitudinal stripes on sides',
      'Marching behavior in massive gregarious swarms across pasture and cereal crops',
      'Defoliates cereal fields completely overnight down to the midrib'
    ],
    pesticides: [
      {
        tradeName: 'Malathion 50% EC',
        activeIngredient: 'Malathion 500 g/L',
        type: 'Organophosphate Contact Insecticide',
        ratePerHa: '1.5 - 2.0 L/ha',
        ratePer16LKnapsack: '100 - 120 mL per 16L knapsack sprayer',
        timing: 'Immediate spray upon sighting marching caterpillar swarms.',
        phiDays: 7,
        rainfastnessHours: 3,
        ppeRequired: ['Respirator', 'Rubber gloves', 'Protective overalls', 'Goggles']
      },
      {
        tradeName: 'Karate 5 EC',
        activeIngredient: 'Lambda-cyhalothrin 50 g/L',
        type: 'Synthetic Pyrethroid',
        ratePerHa: '0.2 - 0.3 L/ha',
        ratePer16LKnapsack: '15 - 20 mL per 16L knapsack sprayer',
        timing: 'Fast knockdown spray over moving fronts.',
        phiDays: 14,
        rainfastnessHours: 1,
        ppeRequired: ['Gloves', 'Coveralls', 'Mask']
      }
    ],
    culturalAndBiocontrol: [
      {
        method: 'Trench Digging Trap',
        descriptionEn: 'Dig a 30 cm deep steep-sided trench along the perimeter of the cereal field. Caterpillars falling into the trench can be buried or killed with lime/ash.',
        descriptionAm: 'ከተምች ወረራ ለመከላከል በማሳው ዙሪያ 30 ሳ.ሜ ጥልቀት ያለው ቦይ በመቆፈር ተምቾቹ እንዳይሻገሩ ማድረግ።'
      }
    ]
  },
  {
    id: 'desert_locust',
    scientificName: 'Schistocerca gregaria',
    commonNameEn: 'Desert Locust',
    commonNameAm: 'የበረሃ አንበጣ',
    commonNameOm: 'Hawwaannisa',
    pestType: 'Insect (Orthoptera: Acrididae)',
    targetCrops: ['All Cereals', 'Pastures', 'Vegetables', 'Trees'],
    etlGuidelines: {
      seedlingStageThreshold: 1, // ANY sighting of gregarious hopper band or swarm
      midWhorlThreshold: 1,
      tasselingThreshold: 1,
      unit: 'Sightings / Hopper bands per hectare',
      assessmentInstruction: 'Any active hopper band or flying swarm warrants immediate emergency reporting to Woreda Agriculture Office and DLCO-EA.'
    },
    identificationKeys: [
      'Hoppers: Bright yellow and black gregarious nymph coloration',
      'Immature flying adults: Pinkish-red coloration',
      'Mature flying adults: Bright yellow coloration with strong flight behavior'
    ],
    pesticides: [
      {
        tradeName: 'Metarhizium acridum (Novacrid / Green Muscle)',
        activeIngredient: 'Metarhizium acridum fungal spores (Biopesticide)',
        type: 'Biological Locust Mycocide',
        ratePerHa: '50 g/ha (ULV aerial or motorized mist)',
        ratePer16LKnapsack: 'Not recommended for manual knapsack; requires ULV mist blowers',
        timing: 'Target 2nd to 4th instar hopper bands in grazing rangelands. 100% safe for livestock and bees.',
        phiDays: 0,
        rainfastnessHours: 4,
        ppeRequired: ['Dust mask', 'Gloves']
      },
      {
        tradeName: 'Chlorpyrifos 480 EC',
        activeIngredient: 'Chlorpyrifos 480 g/L (Emergency aerial application)',
        type: 'Organophosphate',
        ratePerHa: '0.5 L/ha (Controlled by Ministry of Agriculture task force)',
        ratePer16LKnapsack: 'Regulated - Contact Woreda Crop Protection Experts',
        timing: 'Early morning roosting spray.',
        phiDays: 21,
        rainfastnessHours: 3,
        ppeRequired: ['Full Hazmat PPE']
      }
    ],
    culturalAndBiocontrol: [
      {
        method: 'Early Warning Woreda Dispatch',
        descriptionEn: 'Immediately broadcast GPS coordinates to the Desert Locust Control Organization (DLCO-EA) and Ministry of Agriculture response team.',
        descriptionAm: 'አንበጣ የታየበትን ትክክለኛ ቦታ ለወረዳው ግብርና ጽሕፈት ቤትና ለDLCO ወዲያውኑ ማሳወቅ።'
      }
    ]
  },
  {
    id: 'maize_stem_borer',
    scientificName: 'Busseola fusca / Chilo partellus',
    commonNameEn: 'Maize Stem Borer',
    commonNameAm: 'የበቆሎ ግንድ ቆርጣጭ ተምች',
    commonNameOm: 'Bocoyye Qocaa',
    pestType: 'Insect (Lepidoptera: Noctuidae/Crambidae)',
    targetCrops: ['Maize', 'Sorghum'],
    etlGuidelines: {
      seedlingStageThreshold: 5, // 5% plants with "windowpaning"
      midWhorlThreshold: 10, // 10% plants showing pinhole windowing
      tasselingThreshold: 15,
      unit: '% of plants showing pinhole feeding scars on leaves',
      assessmentInstruction: 'Inspect 100 plants across field. Check for small shot-holes / pinholes in young leaves before larvae enter inside the stalk.'
    },
    identificationKeys: [
      'Windowpaning and pinhole feeding perforations on expanding whorl leaves',
      'Frass extruded through holes bored into the central stalk',
      'Deadheart symptom (central growing shoot withers and dies)'
    ],
    pesticides: [
      {
        tradeName: 'Diazinon 10% Granules',
        activeIngredient: 'Diazinon 100 g/kg Granules',
        type: 'Organophosphate Granular formulation',
        ratePerHa: '5.0 - 7.5 kg/ha',
        ratePer16LKnapsack: 'Hand applicator: pinch of 2-3 granules per whorl funnel',
        timing: 'Apply granules directly inside each whorl funnel at 3-4 weeks after germination.',
        phiDays: 21,
        rainfastnessHours: 6,
        ppeRequired: ['Heavy rubber gloves', 'Dust mask']
      }
    ],
    culturalAndBiocontrol: [
      {
        method: 'Stubble Destruction after Harvest',
        descriptionEn: 'Slash maize and sorghum stalks close to ground level and burn or ensile to eliminate overwintering diapausing pupae.',
        descriptionAm: 'ከአጨዳ በኋላ የበቆሎ ግንድ ጉቶዎችን በመንቀል ማቃጠል ወይም ለመኖ ማዋል የተደበቁትን ትሎች ይገድላል።'
      }
    ]
  },
  {
    id: 'coffee_berry_borer',
    scientificName: 'Hypothenemus hampei',
    commonNameEn: 'Coffee Berry Borer (CBB)',
    commonNameAm: 'የቡና ፍሬ ነቀዝ (CBB)',
    commonNameOm: 'Hooftuu Bunaa',
    pestType: 'Insect (Coleoptera: Curculionidae)',
    targetCrops: ['Coffee (Coffea arabica)'],
    etlGuidelines: {
      seedlingStageThreshold: 3, // 3% berry infestation
      midWhorlThreshold: 5, // 5% berry infestation during berry expansion
      tasselingThreshold: 5,
      unit: '% of green coffee berries with entrance holes',
      assessmentInstruction: 'Sample 30 branches across 10 trees. Count total berries and berries with circular entry hole in the navel / blossom end.'
    },
    identificationKeys: [
      'Tiny black beetle (<1.7 mm) boring a round pinhead hole into the berry apex (blossom scar)',
      'Blue-green premature coffee cherries dropping onto the soil',
      'Hollow, damaged beans inside the parchment'
    ],
    pesticides: [
      {
        tradeName: 'Beauveria bassiana (Botanigard / Bio-Power)',
        activeIngredient: 'Beauveria bassiana entomopathogenic fungus spores',
        type: 'Biological Mycological Insecticide',
        ratePerHa: '1.0 - 1.5 kg/ha',
        ratePer16LKnapsack: '80 - 100 g per 16L knapsack sprayer',
        timing: 'Spray when female beetles emerge to search for new cherries, usually 90-120 days after main coffee flowering.',
        phiDays: 0,
        rainfastnessHours: 3,
        ppeRequired: ['Mask', 'Gloves']
      }
    ],
    culturalAndBiocontrol: [
      {
        method: 'Sanitary Strip-Picking (Re-colecta)',
        descriptionEn: 'Pick and boil/destroy all leftover, dried (mummified), and fallen cherries from coffee trees and ground after harvest to break the breeding reservoir.',
        descriptionAm: 'ከመከር በኋላ በዛፉ ላይና መሬት ላይ የቀሩትን የደረቁ የቡና ፍሬዎች ሙሉ በሙሉ ለቅሞ በማቃጠል ማጥፋት።'
      },
      {
        method: 'Ethanol/Methanol Funnel Traps',
        descriptionEn: 'Hang 15-20 plastic bottle traps per hectare baited with 1:1 ethanol-methanol mixture to trap flying adult female beetles.',
        descriptionAm: 'በሄክታር ከ15-20 የፕላስቲክ ጠርሙስ ወጥመድ በአልኮል መፍትሄ ሰቅሎ አዋቂ ነቀዞችን መያዝ።'
      }
    ]
  }
];

/**
 * Economic Threshold Level (ETL) Calculation
 */
function evaluateEconomicThreshold({ pestId, observedDamagePercent, cropStage = 'midWhorl', totalSampledPlants = 100, infestedPlantsCount = null }) {
  const pest = ETHIOPIAN_PEST_REGISTRY.find(p => p.id === pestId) || ETHIOPIAN_PEST_REGISTRY[0];

  let calculatedDamage = observedDamagePercent;
  if (infestedPlantsCount !== null && totalSampledPlants > 0) {
    calculatedDamage = (infestedPlantsCount / totalSampledPlants) * 100;
  }

  let threshold = pest.etlGuidelines.midWhorlThreshold;
  if (cropStage === 'seedling') {
    threshold = pest.etlGuidelines.seedlingStageThreshold;
  } else if (cropStage === 'tasseling' || cropStage === 'flowering' || cropStage === 'fruiting') {
    threshold = pest.etlGuidelines.tasselingThreshold;
  }

  const isAboveETL = calculatedDamage >= threshold;
  const ratio = (calculatedDamage / threshold);

  let recommendation;
  let severityLevel;
  if (ratio >= 1.5) {
    severityLevel = 'CRITICAL_OUTBREAK';
    recommendation = {
      action: 'TREAT_IMMEDIATELY',
      urgency: 'HIGH_PRIORITY_SPRAY',
      en: `Observed damage (${calculatedDamage.toFixed(1)}%) is severely above the economic injury threshold (${threshold}%). Significant yield loss imminent. Deploy recommended chemical or bio-rational spray within 24 hours.`,
      am: `የተገኘው የተባይ ጉዳት መጠን (${calculatedDamage.toFixed(1)}%) ከኢኮኖሚ ጉዳት ወሰን (${threshold}%) በእጅጉ በላይ ነው። ሰብሉን ለመታደግ በአስቸኳይ በ24 ሰዓት ውስጥ የፀረ-ተባይ ርጭት ይተግብሩ።`
    };
  } else if (isAboveETL) {
    severityLevel = 'ECONOMIC_THRESHOLD_EXCEEDED';
    recommendation = {
      action: 'TREAT_NOW',
      urgency: 'ACTION_REQUIRED',
      en: `Observed damage (${calculatedDamage.toFixed(1)}%) has reached the economic threshold (${threshold}%). Chemical treatment is financially justified to prevent exponential spread.`,
      am: `የተባይ ጉዳቱ (${calculatedDamage.toFixed(1)}%) የኢኮኖሚ ጉዳት ወሰን (${threshold}%) ላይ ደርሷል። የሰብል ኪሳራን ለመከላከል አሁን የርጭት እርምጃ መውሰድ ያስፈልጋል።`
    };
  } else if (ratio >= 0.6) {
    severityLevel = 'WARNING_MONITOR_CLOSELY';
    recommendation = {
      action: 'MONITOR_CLOSELY',
      urgency: 'RESCOUT_IN_3_DAYS',
      en: `Observed damage (${calculatedDamage.toFixed(1)}%) is below chemical action threshold (${threshold}%). Do NOT spray chemicals now to preserve beneficial predatory insects. Re-scout in 3-5 days.`,
      am: `ጉዳቱ (${calculatedDamage.toFixed(1)}%) እስካሁን እርምጃ ከሚያስወስደው ወሰን (${threshold}%) በታች ነው። የተፈጥሮ አዳኝ ነፍሳትን ላለመጉዳት አሁን አይርጩ፤ ከ3-5 ቀናት በኋላ ድጋሚ ይመርምሩ።`
    };
  } else {
    severityLevel = 'SAFE_BELOW_THRESHOLD';
    recommendation = {
      action: 'NO_CHEMICAL_ACTION',
      urgency: 'ROUTINE_SCOUTING',
      en: `Observed damage (${calculatedDamage.toFixed(1)}%) is well below threshold (${threshold}%). Natural biological enemies (parasitoid wasps, ladybirds, spiders) are actively keeping pest populations in check.`,
      am: `ጉዳቱ በጣም አነስተኛ ነው። የተፈጥሮ አዳኞች ተባዩን እየተቆጣጠሩት ስለሆነ ምንም አይነት የኬሚካል ርጭት አያስፈልግም።`
    };
  }

  return {
    pestId: pest.id,
    scientificName: pest.scientificName,
    commonNameEn: pest.commonNameEn,
    commonNameAm: pest.commonNameAm,
    cropStage,
    observedDamagePercent: parseFloat(calculatedDamage.toFixed(1)),
    thresholdPercent: threshold,
    severityLevel,
    isAboveETL,
    recommendation,
    firstLinePesticides: pest.pesticides,
    culturalControls: pest.culturalAndBiocontrol
  };
}

module.exports = {
  ETHIOPIAN_PEST_REGISTRY,
  evaluateEconomicThreshold
};
