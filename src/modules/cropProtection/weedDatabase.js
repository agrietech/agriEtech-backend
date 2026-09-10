/**
 * Ethiopian Weed Database & Selective Herbicide Prescriptions
 * Grounded in Ethiopian Institute of Agricultural Research (EIAR) & Ministry of Agriculture (MoA) standards.
 */

const ETHIOPIAN_WEED_REGISTRY = [
  {
    id: 'parthenium_hysterophorus',
    scientificName: 'Parthenium hysterophorus',
    commonNameEn: 'Parthenium / Famine Weed',
    commonNameAm: 'ኮንግን (Parthenium)',
    commonNameOm: 'Aramaa Parteniyem',
    weedType: 'Broadleaf',
    lifecycle: 'Annual',
    invasiveSeverity: 'CRITICAL',
    descriptionEn: 'Aggressive invasive weed causing severe yield loss (up to 80%) in Sorghum, Maize, and Teff. Produces allergenic parthenin toxin toxic to humans and cattle.',
    descriptionAm: 'በማሽላ፣ በበቆሎ እና በጤፍ ሰብሎች ላይ እስከ 80% የሚደርስ የምርት ኪሳራ የሚያስከትል አደገኛ ወራሪ አረም ነው።',
    targetCrops: ['Sorghum', 'Maize', 'Teff', 'Wheat', 'Pasture'],
    identificationKeys: [
      'Deeply dissected pale green leaves with fine hairs',
      'Small white flower heads (4-5 mm) clustered at top',
      'Long taproot and prolific seed production (up to 25,000 seeds/plant)'
    ],
    herbicides: [
      {
        tradeName: '2,4-D Amine 720 SL',
        activeIngredient: '2,4-D Dimethylamine salt 720 g/L',
        chemicalFamily: 'Synthetic Auxin (Group 4)',
        selectiveFor: ['Teff', 'Wheat', 'Maize', 'Sorghum'],
        ratePerHectare: '1.0 - 1.5 L/ha',
        ratePer16LKnapsack: '60 - 80 mL per 16L knapsack sprayer',
        sprayVolumeLitersPerHa: 200,
        timing: 'Apply when Parthenium is at young seedling rosette stage (2-4 leaves) before flowering.',
        phiDays: 14,
        rainfastnessHours: 3,
        ppeRequired: ['Rubber gloves', 'Respirator mask', 'Eye goggles', 'Rubber boots'],
        notesEn: 'Do NOT apply on broadleaf crops like legumes or coffee. Avoid drift to adjacent vegetable fields.',
        notesAm: 'እንደ ባቄላ እና አተር ባሉ ሰፊ ቅጠል ሰብሎች ወይም ቡና ላይ በፍጹም አይርጩ።'
      },
      {
        tradeName: 'Palace 75 WG',
        activeIngredient: 'Pyroxsulam 75 g/kg',
        chemicalFamily: 'ALS Inhibitor (Group 2)',
        selectiveFor: ['Wheat'],
        ratePerHectare: '40 - 50 g/ha',
        ratePer16LKnapsack: '3 - 4 g per 16L knapsack sprayer',
        sprayVolumeLitersPerHa: 200,
        timing: 'Apply at 2 to 4 weed leaves during wheat tillering stage.',
        phiDays: 30,
        rainfastnessHours: 2,
        ppeRequired: ['Rubber gloves', 'Protective coverall', 'Eye goggles'],
        notesEn: 'Excellent broad-spectrum control in wheat against both Parthenium and grass weeds.',
        notesAm: 'በስንዴ ማሳ ላይ ኮንግንን እና የሳር አረሞችን በአንድ ላይ ለመቆጣጠር ከፍተኛ ብቃት አለው።'
      },
      {
        tradeName: 'Roundup 480 SL / Glyphosate',
        activeIngredient: 'Glyphosate isopropylamine 480 g/L',
        chemicalFamily: 'EPSP Synthase Inhibitor (Group 9)',
        selectiveFor: ['Non-selective / Pre-plant / Fallow land only'],
        ratePerHectare: '2.5 - 3.0 L/ha',
        ratePer16LKnapsack: '150 - 200 mL per 16L knapsack sprayer',
        sprayVolumeLitersPerHa: 200,
        timing: 'Pre-planting or post-harvest fallow clearing. Systemic non-selective.',
        phiDays: 0,
        rainfastnessHours: 4,
        ppeRequired: ['Full protective suit', 'Rubber gloves', 'Respirator mask', 'Boots'],
        notesEn: 'NON-SELECTIVE! Kills all green vegetation. Do NOT spray over emerged crops.',
        notesAm: 'ሁሉንም አረም የሚያጠፋ (Non-selective) ስለሆነ ሰብል ከበቀለ በኋላ በፍጹም አይረጭም። ከእርሻ በፊት ብቻ ይጠቀሙ።'
      }
    ],
    culturalControls: [
      {
        method: 'Hand Weeding before Flowering',
        instructionsEn: 'Uproot weeds wearing rubber gloves before white flowers appear to prevent seed bank deposition.',
        instructionsAm: 'ዘር ከማፍራቱ በፊት በጓንት ነቅሎ ማቃጠል ወይም ማጥፋት።'
      },
      {
        method: 'Stale Seedbed Preparation',
        instructionsEn: 'Plow 2 weeks before sowing, allow first rains to trigger Parthenium emergence, then shallow-till to kill seedlings.',
        instructionsAm: 'ከመዝራት 2 ሳምንት በፊት በማረስ አረሙ ሲበቅል ደግሞ በማረም ማጥፋት (Stale Seedbed)።'
      },
      {
        method: 'Competitive Forage Intercropping',
        instructionsEn: 'Plant fast-growing competitive legumes or forage grasses like Chloris gayana to outcompete Parthenium.',
        instructionsAm: 'ተፎካካሪ የሆኑ ፈጣን አብቃይ መኖ ሰብሎችን በመዝራት የኮንግንን እድገት መግታት።'
      }
    ]
  },
  {
    id: 'striga_hermonthica',
    scientificName: 'Striga hermonthica',
    commonNameEn: 'Witchweed / Striga',
    commonNameAm: 'አከንችራ (Striga)',
    commonNameOm: 'Aramaa Akanciraa',
    weedType: 'Parasitic Broadleaf',
    lifecycle: 'Annual Root Parasite',
    invasiveSeverity: 'CRITICAL',
    descriptionEn: 'Obligate root parasitic weed attaching to Sorghum and Maize roots via haustoria, stealing water and nutrients. Emits toxins causing severe crop stunting.',
    descriptionAm: 'የማሽላ እና የበቆሎ ስር ላይ በመጣበቅ ንጥረ ነገርና ውሃ የሚቀማ፣ ሰብሉን ድንክ የሚያደርግ አደገኛ ተውሳክ አረም ነው።',
    targetCrops: ['Sorghum', 'Maize', 'Millet'],
    identificationKeys: [
      'Bright pink to purple flowers with irregular 5 lobes',
      'Rough square hairy stems, 30-80 cm tall',
      'Emerges directly from the base of maize/sorghum stems'
    ],
    herbicides: [
      {
        tradeName: '2,4-D Amine 720 SL',
        activeIngredient: '2,4-D Dimethylamine salt 720 g/L',
        chemicalFamily: 'Synthetic Auxin (Group 4)',
        selectiveFor: ['Sorghum', 'Maize'],
        ratePerHectare: '1.2 - 1.5 L/ha',
        ratePer16LKnapsack: '70 - 90 mL per 16L knapsack sprayer',
        sprayVolumeLitersPerHa: 200,
        timing: 'Directed spray at the base of maize/sorghum when Striga shoots first emerge, before flowering.',
        phiDays: 14,
        rainfastnessHours: 3,
        ppeRequired: ['Rubber gloves', 'Goggles', 'Boots'],
        notesEn: 'Use directed spray nozzle shields to prevent chemical from contacting the crop whorl.',
        notesAm: 'በቀጥታ አከንችራው ላይ ብቻ እንዲያርፍ መርጫውን ወደ ታች አቅንቶ መርጨት፤ የበቆሎውን እምብርት እንዳይነካ መጠንቀቅ።'
      }
    ],
    culturalControls: [
      {
        method: 'Desmodium "Push-Pull" Intercropping',
        instructionsEn: 'Intercrop maize/sorghum with Silverleaf or Greenleaf Desmodium (Desmodium uncinatum). Desmodium roots produce suicidal germination chemicals (isoschaftoside) that decimate Striga seed reserves.',
        instructionsAm: 'በቆሎን ከደስሞዲየም (Desmodium) ጋር በሰልፍ ማቀላቀል (Push-Pull)፤ የደስሞዲየም ስር አከንችራን በኬሚካል ያመክናል።'
      },
      {
        method: 'Crop Rotation with Trap Crops',
        instructionsEn: 'Rotate infested fields with non-host trap crops (Cowpea, Soybean, Cotton, Groundnut) which trigger Striga suicidal germination.',
        instructionsAm: 'አከንችራ በማይዘው ሰብል እንደ አኩሪ አተር፣ ቦሎቄ እና ጥጥ ጋር ማፈራረቅ።'
      },
      {
        method: 'High Nitrogen Fertilizer Application',
        instructionsEn: 'Apply adequate Urea or compost. High soil nitrogen significantly suppresses Striga seed germination and haustorial attachment.',
        instructionsAm: 'በቂ የዩሪያ ማዳበሪያ ወይም ኮምፖስት መጠቀም፤ ናይትሮጅን ሲጨምር የአከንችራ ጥቃት ይቀንሳል።'
      }
    ]
  },
  {
    id: 'avena_fatua',
    scientificName: 'Avena fatua',
    commonNameEn: 'Wild Oat',
    commonNameAm: 'ሙጃ / አራዊት አጃ (Wild Oat)',
    commonNameOm: 'Sinbiraa / Gaayyoo',
    weedType: 'Grass',
    lifecycle: 'Annual',
    invasiveSeverity: 'HIGH',
    descriptionEn: 'Major grass weed infesting highland Wheat and Barley fields across Arsi, Bale, and Gojjam. Mimics wheat in early stages and causes up to 60% yield loss.',
    descriptionAm: 'በአርሲ፣ ባሌ እና ጎጃም በስንዴ እና ገብስ ማሳዎች ላይ ከፍተኛ ጉዳት የሚያደርስ፣ ስንዴን የሚመስል የሳር አረም ነው።',
    targetCrops: ['Wheat', 'Barley'],
    identificationKeys: [
      'Ligule is prominent and membranous, no auricles (distinguishes from wheat)',
      'Leaves twist counter-clockwise (unlike cultivated cereals)',
      'Open nodding panicle with dark awned seeds that shatter early'
    ],
    herbicides: [
      {
        tradeName: 'Pallas 45 OD',
        activeIngredient: 'Pyroxsulam 45 g/L',
        chemicalFamily: 'ALS Inhibitor (Triazolopyrimidine)',
        selectiveFor: ['Wheat'],
        ratePerHectare: '0.4 - 0.5 L/ha',
        ratePer16LKnapsack: '25 - 30 mL per 16L knapsack sprayer',
        sprayVolumeLitersPerHa: 200,
        timing: 'Apply when wild oat is at 2-3 leaf stage and wheat has 3 leaves to mid-tillering.',
        phiDays: 35,
        rainfastnessHours: 2,
        ppeRequired: ['Nitrile gloves', 'Safety glasses', 'Protective overalls'],
        notesEn: 'Do NOT use on Barley (only selective in Wheat). Controls both Avena fatua and broadleaf weeds.',
        notesAm: 'በስንዴ ላይ ብቻ ይጠቀሙ፤ በገብስ ላይ በፍጹም አይርጩ (ገብስን ያጠፋል)።'
      },
      {
        tradeName: 'Topic 080 EC',
        activeIngredient: 'Clodinafop-propargyl 80 g/L + Cloquintocet-mexyl safener',
        chemicalFamily: 'ACCase Inhibitor (Aryloxyphenoxypropionate)',
        selectiveFor: ['Wheat'],
        ratePerHectare: '0.25 - 0.3 L/ha',
        ratePer16LKnapsack: '18 - 22 mL per 16L knapsack sprayer',
        sprayVolumeLitersPerHa: 200,
        timing: 'Post-emergence at 2 to 4 leaf stage of wild oat. Rapid systemic uptake.',
        phiDays: 45,
        rainfastnessHours: 1,
        ppeRequired: ['Chemical resistant gloves', 'Boots', 'Respirator'],
        notesEn: 'Specific graminicide for wheat. Extremely effective on wild oat and canary grass.',
        notesAm: 'ለስንዴ የተለየ የሙጃ ማጥፊያ፤ ሙጃ በ2-4 ቅጠል ላይ ሲሆን ይርጩ።'
      }
    ],
    culturalControls: [
      {
        method: 'Certified Clean Seed Sowing',
        instructionsEn: 'Use certified wheat seed cleaned of wild oat seeds to prevent field contamination.',
        instructionsAm: 'የተመሰከረለት እና ከሙጃ ዘር የጸዳ ንጹህ የስንዴ ዘር መጠቀም።'
      },
      {
        method: 'Crop Rotation with Faba Bean or Field Pea',
        instructionsEn: 'Rotate cereal monoculture with legumes every 2-3 seasons to break the wild oat seed cycle.',
        instructionsAm: 'ከጥራጥሬ ሰብሎች (ባቄላ፣ አተር) ጋር በማፈራረቅ የሳር አረም ዑደቱን መስበር።'
      }
    ]
  },
  {
    id: 'phalaris_paradoxa',
    scientificName: 'Phalaris paradoxa / Phalaris minor',
    commonNameEn: 'Hooded Canary Grass',
    commonNameAm: 'ድንጋይ ሳር / ቀንድ ሳር',
    commonNameOm: 'Marga Qanxoo',
    weedType: 'Grass',
    lifecycle: 'Annual',
    invasiveSeverity: 'HIGH',
    descriptionEn: 'Aggressive winter grass weed infesting highland wheat crops, forming dense mats that crowd out wheat seedlings.',
    descriptionAm: 'በከፍተኛ የደጋ ስንዴ አብቃይ አካባቢዎች ስንዴን አፍኖ የሚይዝ እና ምርት የሚያሳጣ የሳር አረም ነው።',
    targetCrops: ['Wheat', 'Barley'],
    identificationKeys: [
      'Dense cylindrical spike head',
      'Leaves exude pinkish-red sap at the crown when cut at seedling stage',
      'Narrow membranous ligule with no auricles'
    ],
    herbicides: [
      {
        tradeName: 'Pallas 45 OD',
        activeIngredient: 'Pyroxsulam 45 g/L',
        chemicalFamily: 'ALS Inhibitor',
        selectiveFor: ['Wheat'],
        ratePerHectare: '0.45 L/ha',
        ratePer16LKnapsack: '28 mL per 16L knapsack sprayer',
        sprayVolumeLitersPerHa: 200,
        timing: 'Apply at 2 to 4 leaf stage of canary grass during wheat tillering.',
        phiDays: 35,
        rainfastnessHours: 2,
        ppeRequired: ['Rubber gloves', 'Protective clothing', 'Goggles'],
        notesEn: 'Provides dual control for both Phalaris and broadleaf weeds in wheat.',
        notesAm: 'ድንጋይ ሳርን እና ሰፊ ቅጠሎችን በአንድ ላይ በስንዴ ላይ ያጠፋል።'
      },
      {
        tradeName: 'Topic 080 EC',
        activeIngredient: 'Clodinafop-propargyl 80 g/L',
        chemicalFamily: 'ACCase Inhibitor',
        selectiveFor: ['Wheat'],
        ratePerHectare: '0.3 L/ha',
        ratePer16LKnapsack: '20 mL per 16L knapsack sprayer',
        sprayVolumeLitersPerHa: 200,
        timing: 'Apply post-emergence when canary grass is 2-4 leaves.',
        phiDays: 45,
        rainfastnessHours: 1,
        ppeRequired: ['Gloves', 'Coverall', 'Goggles'],
        notesEn: 'Dedicated grass weed killer for wheat.',
        notesAm: 'ለስንዴ ማሳ የተመረጠ የሳር ማጥፊያ።'
      }
    ],
    culturalControls: [
      {
        method: 'Early Post-Emergence Hand Pulling',
        instructionsEn: 'Hand pull rogue grass seedlings before spike emergence.',
        instructionsAm: 'ድንጋይ ሳር ዘር ከማውጣቱ በፊት ቀድሞ በእጅ መንቀል።'
      }
    ]
  },
  {
    id: 'datura_stramonium',
    scientificName: 'Datura stramonium',
    commonNameEn: 'Jimsonweed / Thorn Apple',
    commonNameAm: 'አስቴር / አጣፋሪር (Datura)',
    commonNameOm: 'Asteer / Xaxara',
    weedType: 'Broadleaf',
    lifecycle: 'Annual',
    invasiveSeverity: 'MODERATE',
    descriptionEn: 'Poisonous annual broadleaf weed containing tropane alkaloids. Seeds and foliage are toxic to livestock. Competes strongly for moisture.',
    descriptionAm: 'መርዛማ ሰፊ ቅጠል አረም፤ ቅጠሉ እና ፍሬው ለከብቶች መርዛማ ሲሆን በቆሎ እና ሌሎች ሰብሎችን በእርጥበት ይሻማል።',
    targetCrops: ['Maize', 'Sorghum', 'Teff', 'Soybean', 'Vegetables'],
    identificationKeys: [
      'Large lobed leaves with foul scent when crushed',
      'White to pale violet trumpet-shaped erect flowers',
      'Prickly egg-shaped seed capsule covered in sharp thorns'
    ],
    herbicides: [
      {
        tradeName: '2,4-D Amine 720 SL',
        activeIngredient: '2,4-D Dimethylamine salt 720 g/L',
        chemicalFamily: 'Synthetic Auxin (Group 4)',
        selectiveFor: ['Teff', 'Wheat', 'Maize', 'Sorghum'],
        ratePerHectare: '1.0 - 1.2 L/ha',
        ratePer16LKnapsack: '60 - 75 mL per 16L knapsack sprayer',
        sprayVolumeLitersPerHa: 200,
        timing: 'Spray young seedlings before thorn capsules form.',
        phiDays: 14,
        rainfastnessHours: 3,
        ppeRequired: ['Rubber gloves', 'Protective clothing', 'Respirator'],
        notesEn: 'Spray on warm sunny morning when stomata are fully open.',
        notesAm: 'ሞቃትና ፀሀያማ በሆነ ጠዋት ላይ አረሙ ገና ለጋ እያለ ይርጩ።'
      },
      {
        tradeName: 'Derby 175 SC',
        activeIngredient: 'Florasulam 75 g/L + Flumetsulam 100 g/L',
        chemicalFamily: 'ALS Inhibitor',
        selectiveFor: ['Teff', 'Wheat', 'Barley'],
        ratePerHectare: '0.05 - 0.07 L/ha (50-70 mL/ha)',
        ratePer16LKnapsack: '4 - 5 mL per 16L knapsack sprayer',
        sprayVolumeLitersPerHa: 200,
        timing: 'Apply at 2-6 leaf stage of broadleaf weeds during cereal tillering.',
        phiDays: 30,
        rainfastnessHours: 2,
        ppeRequired: ['Gloves', 'Goggles', 'Apron'],
        notesEn: 'Ultra-low dosage, safe on Teff and Wheat with outstanding broadleaf control.',
        notesAm: 'በጣም አነስተኛ መጠን የሚጠይቅና በጤፍና በስንዴ ላይ በጣም አስተማማኝ የሆነ።'
      }
    ],
    culturalControls: [
      {
        method: 'Physical Removal with Gloves',
        instructionsEn: 'Wear gloves when handling to avoid contact dermatitis; chop taproot below ground level before seed setting.',
        instructionsAm: 'መርዛማ ስለሆነ ጓንት በማድረግ ከመሬት ስሩን ቆርጦ ማጥፋት።'
      }
    ]
  },
  {
    id: 'amaranthus_hybridus',
    scientificName: 'Amaranthus hybridus / Amaranthus spinosus',
    commonNameEn: 'Smooth Pigweed / Spiny Amaranth',
    commonNameAm: 'ሊሻሊሾ / እሾሃማ ሊሻሊሾ',
    commonNameOm: 'Raafuu / Qoreessa',
    weedType: 'Broadleaf',
    lifecycle: 'Annual',
    invasiveSeverity: 'MODERATE',
    descriptionEn: 'Rapidly growing C4 broadleaf weed thriving in fertile warm soils, competing aggressively with Maize, Beans, and Teff for nitrogen.',
    descriptionAm: 'በሞቃትና ለም አፈር ላይ በፍጥነት የሚበቅል፣ በቆሎ እና ጤፍን ናይትሮጅን የሚሻማ ሰፊ ቅጠል አረም ነው።',
    targetCrops: ['Maize', 'Teff', 'Wheat', 'Faba Bean', 'Vegetables'],
    identificationKeys: [
      'Reddish or purplish tinge at stem base and leaf veins',
      'Dense terminal green or red spike inflorescence',
      'Pointed leaves with long petioles'
    ],
    herbicides: [
      {
        tradeName: '2,4-D Amine 720 SL',
        activeIngredient: '2,4-D Dimethylamine salt 720 g/L',
        chemicalFamily: 'Synthetic Auxin (Group 4)',
        selectiveFor: ['Teff', 'Wheat', 'Maize', 'Sorghum'],
        ratePerHectare: '1.0 L/ha',
        ratePer16LKnapsack: '50 - 60 mL per 16L knapsack sprayer',
        sprayVolumeLitersPerHa: 200,
        timing: 'Apply when weeds are under 10 cm height.',
        phiDays: 14,
        rainfastnessHours: 3,
        ppeRequired: ['Rubber gloves', 'Boots', 'Eye protection'],
        notesEn: 'Most economical broadleaf control in cereal crops.',
        notesAm: 'ለጥራጥሬ እና እህል ሰብሎች ተመጣጣኝና ፈጣን የሊሻሊሾ መቆጣጠሪያ።'
      }
    ],
    culturalControls: [
      {
        method: 'Early Inter-row Hoeing',
        instructionsEn: 'Cultivate with ox-drawn plow or hand hoe between crop rows 2-3 weeks after sowing.',
        instructionsAm: 'በሬ በማረስ ወይም በእጅ ቆፋሮ በረድፎች መካከል ማረም።'
      }
    ]
  }
];

/**
 * Calculate knapsack spray dilution and tank fill requirements
 * Standard Ethiopian knapsack sprayer tank capacity = 16 Liters
 * Standard water volume per hectare = 200 Liters (12.5 knapsacks per hectare)
 */
function calculateKnapsackDosage({ areaHectares, ratePerHa, knapsackVolumeLiters = 16, sprayVolumeHa = 200 }) {
  const totalSprayWaterLiters = areaHectares * sprayVolumeHa;
  const totalKnapsacksNeeded = Math.ceil(totalSprayWaterLiters / knapsackVolumeLiters);
  
  // Rate could be e.g. "1.2 L/ha" or "50 g/ha"
  let parsedRate = 1.0;
  let unit = 'L';
  const match = String(ratePerHa).match(/([\d.]+)\s*([a-zA-Z]+)/);
  if (match) {
    parsedRate = parseFloat(match[1]);
    unit = match[2].toUpperCase();
  }

  const totalChemicalNeeded = parsedRate * areaHectares;
  const chemicalPerKnapsack = (parsedRate / (sprayVolumeHa / knapsackVolumeLiters));

  return {
    areaHectares: parseFloat(areaHectares.toFixed(2)),
    sprayVolumeHa,
    knapsackVolumeLiters,
    totalKnapsacksNeeded,
    totalChemicalNeeded: parseFloat(totalChemicalNeeded.toFixed(2)),
    chemicalPerKnapsack: parseFloat(chemicalPerKnapsack.toFixed(2)),
    unit: unit === 'L' ? 'Liters' : (unit === 'G' ? 'Grams' : unit),
    dosagePer16LTank: unit === 'L' 
      ? `${Math.round(chemicalPerKnapsack * 1000)} mL per 16L knapsack`
      : `${chemicalPerKnapsack.toFixed(1)} g per 16L knapsack`
  };
}

module.exports = {
  ETHIOPIAN_WEED_REGISTRY,
  calculateKnapsackDosage
};
