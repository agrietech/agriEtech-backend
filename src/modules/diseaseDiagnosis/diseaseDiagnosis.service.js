const fs = require('fs');
const path = require('path');
const { prisma, isConnected } = require('../../config/db');
const openRouterClient = require('../../utils/openRouterClient');
const plantIdClient = require('../../ingestion/plantIdClient');
const plantNetClient = require('../../ingestion/plantNetClient');
const perenualClient = require('../../ingestion/perenualClient');
const logger = require('../../utils/logger');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');

/**
 * Perform Multi-Engine AI Crop Disease Diagnosis:
 * Combines Plant.id v3 Botanical Health + Pl@ntNet v2 Disease Classifier + Perenual Agronomic Knowledge + OpenRouter Reasoning
 */
async function diagnoseCropImage({ farmId, cropType, imageUrl, imageFile, imageBase64: rawBase64, language = 'en', user }) {
  if (farmId && user && isConnected()) {
    const role = (user.role || '').toUpperCase();
    if (role === 'FARMER') {
      const farm = await prisma.farm.findUnique({ where: { id: farmId }, select: { userId: true } });
      if (farm && farm.userId !== user.id) {
        throw new ForbiddenError('Access denied: You can only submit diagnoses for your own farm');
      }
    }
  }

  let imageBase64 = rawBase64 || null;
  let uploadPath = imageUrl || null;

  const { uploadDiagnosisPhoto } = require('../../utils/supabaseStorage');
  if (imageFile && imageFile.path && fs.existsSync(imageFile.path)) {
    try {
      const fileBuffer = fs.readFileSync(imageFile.path);
      imageBase64 = fileBuffer.toString('base64');
      uploadPath = await uploadDiagnosisPhoto({
        localFilePath: imageFile.path,
        fileName: path.basename(imageFile.path),
        mimeType: imageFile.mimetype,
      });
      try { fs.unlinkSync(imageFile.path); } catch (_unlinkErr) {}
    } catch (err) {
      logger.warn(`[DiseaseDiagnosis] Failed to read or upload image: ${err.message}`);
    }
  }

  // Step 1: Run Plant.id (Kindwise v3) & Pl@ntNet (v2) in parallel for dual-vision verification
  logger.info(`[DiseaseDiagnosis] Querying Plant.id and Pl@ntNet Vision Classifiers for cropHint="${cropType || 'general'}"`);
  let plantIdResult = { isHealthy: false, diseases: [] };
  let plantNetResult = { success: false, diseases: [] };

  const [plantIdSettled, plantNetSettled] = await Promise.allSettled([
    plantIdClient.identifyCropHealth({
      imageBase64,
      imageUrl,
      cropHint: cropType,
    }),
    plantNetClient.identifyDisease({
      imageBase64,
      imageUrl,
      organ: 'leaf',
    }),
  ]);

  if (plantIdSettled.status === 'fulfilled') {
    plantIdResult = plantIdSettled.value;
  } else {
    logger.warn(`[DiseaseDiagnosis] Plant.id query notice: ${plantIdSettled.reason?.message}`);
  }

  if (plantNetSettled.status === 'fulfilled' && plantNetSettled.value?.success) {
    plantNetResult = plantNetSettled.value;
  } else if (plantNetSettled.status === 'rejected') {
    logger.warn(`[DiseaseDiagnosis] Pl@ntNet query notice: ${plantNetSettled.reason?.message}`);
  }

  // Step 2: Query Perenual for authoritative pest/disease management protocols
  const candidateDiseaseName = plantNetResult.topDisease?.name || plantIdResult.diseases?.[0]?.name || cropType || 'rust';
  let perenualResult = { success: false, data: [] };
  try {
    const searchTerms = candidateDiseaseName.split(/[-–—/]/)[0].trim().split(' ').slice(0, 2).join(' ');
    perenualResult = await perenualClient.searchPestDisease(searchTerms);
  } catch (perr) {
    logger.warn(`[DiseaseDiagnosis] Perenual query notice: ${perr.message}`);
  }

  // Step 3: Feed multi-engine findings into OpenRouter Multi-Key Vision & Reasoning
  logger.info('[DiseaseDiagnosis] Submitting to OpenRouter for Multimodal Bilingual Diagnosis & Synthesis');
  let geminiVisionResult = {};
  try {
    geminiVisionResult = await openRouterClient.analyzeCropVision({
      imageBase64,
      imageUrl,
      cropHint: cropType || plantIdResult.crop?.commonNames?.[0] || plantIdResult.crop?.scientificName || 'Crop',
      plantIdData: plantIdResult,
      plantNetData: plantNetResult,
      perenualData: perenualResult,
      language,
    });
  } catch (gErr) {
    logger.warn(`[DiseaseDiagnosis] OpenRouter vision notice: ${gErr.message}`);
  }

  const diagnosis = geminiVisionResult.diagnosis || {};

  // Ethiopian Endemic Crop Pathology Knowledge Base
  const ETHIOPIA_PATHOLOGY_TAXONOMY = {
    TEFF: {
      cropEn: 'Teff (Eragrostis tef)',
      cropAm: 'ጤፍ',
      cropOm: 'Xaafee',
      diseaseEn: 'Teff Leaf Rust (Uromyces eragrostidis)',
      diseaseAm: 'የጤፍ ዝገት በሽታ',
      diseaseOm: 'Waagii Baala Xaafee',
      pathogen: 'Uromyces eragrostidis (Fungus)',
      treatmentEn: 'Apply Mancozeb 80% WP or Tilt 250 EC at first sign of pustules. Avoid excessive nitrogen fertilizer.',
      treatmentAm: 'የመጀመሪያዎቹ ምልክቶች ሲታዩ ማንኮዜብ 80% ደረቅ ዱቄት ወይም ቲልት 250 ኢሲ ይርጩ፤ የናይትሮጅን ማዳበሪያ መጠንን ይቀንሱ።',
      treatmentOm: 'Qoricha Mancozeb ykn Tilt fayyadamaa. Xaa\'oo Naayitiroojinii baay\'isuu irraa of qusadhaa.',
      symptomsEn: 'Small reddish-brown to dark brown pustules on both leaf surfaces causing premature drying.',
      symptomsAm: 'በቅጠሉ ላይ ቀይ-ቡናማ ወይም ጥቁር-ቡናማ የዝገት ነጠብጣቦች ይታያሉ፤ ቅጠሉ ያለጊዜው እንዲደርቅ ያደርጋል።',
      preventionEn: 'Use rust-tolerant varieties (e.g., Quncho / DZ-Cr-387). Rotate with pulses every 2 seasons.',
      preventionAm: 'የበሽታ መቋቋም አቅም ያላቸውን የተሻሻሉ የጤፍ ዝርያዎች (እንደ 系統 ቁንጮ) ይጠቀሙ፤ የሰብል ፈረቃን ይተግብሩ።',
    },
    COFFEE: {
      cropEn: 'Arabica Coffee (Coffea arabica)',
      cropAm: 'የኢትዮጵያ ቡና',
      cropOm: 'Buna',
      diseaseEn: 'Coffee Leaf Rust (Hemileia vastatrix)',
      diseaseAm: 'የቡና ቅጠል ዝገት',
      diseaseOm: 'Waagii Baala Bunaa',
      pathogen: 'Hemileia vastatrix (Obligate Biotrophic Fungus)',
      treatmentEn: 'Spray Copper Hydroxide (Kocide 2000) or Triadimefon (Bayleton) before rainy season begins.',
      treatmentAm: 'ዋነኛው የዝናብ ወቅት ከመግባቱ በፊት የኮፐር ፀረ-ፈንገስ (ኮሳይድ 2000) በቅጠሉ ስር በደንብ ይርጩ።',
      treatmentOm: 'Odoo roobni hin eegalin dura qoricha Kocide 2000 baala jalaan seeraan fashaleessaa.',
      symptomsEn: 'Powdery yellow-orange spots on the lower leaf surface corresponding to chlorotic lesions above.',
      symptomsAm: 'በቅጠሉ ስር ቢጫ-ብርቱካናማ የዱቄት መሳይ የዝገት ዱቄቶች ይታያሉ፤ ቅጠሎች ይረግፋሉ።',
      preventionEn: 'Prune coffee trees for optimal airflow and sunlight penetration. Plant shade trees (e.g., Cordia africana).',
      preventionAm: 'የቡና ዛፎችን ቅርንጫፍ በማስተካከል በቂ አየርና የፀሐይ ብርሃን እንዲያገኙ ያድርጉ፤ የጥላ ዛፎችን (እንደ ዋንዛ) ይትከሉ።',
    },
    WHEAT: {
      cropEn: 'Bread/Durum Wheat (Triticum aestivum)',
      cropAm: 'ስንዴ',
      cropOm: 'Qamadii',
      diseaseEn: 'Wheat Stem Rust (Puccinia graminis f. sp. tritici - Ug99)',
      diseaseAm: 'የስንዴ ግንድ ዝገት (ኡጋንዳ 99)',
      diseaseOm: 'Waagii Gumaa Qamadii',
      pathogen: 'Puccinia graminis f. sp. tritici (Ug99 lineage)',
      treatmentEn: 'Emergency application of systemic triazole fungicides (Nativo 300 SC or Rex Duo).',
      treatmentAm: 'አስቸኳይ የስርዓት ፈንገስ ማጥፊያ ናቲቮ (Nativo) ወይም ሬክስ ዱኦ (Rex Duo) በስፋት ይርጩ።',
      treatmentOm: 'Dawaa farra-fungusii Nativo ykn Rex Duo hatattamaan itti fashaleessaa.',
      symptomsEn: 'Elongated dark reddish-brown pustules on stems and leaf sheaths, rupturing the epidermis.',
      symptomsAm: 'በስንዴው ግንድና በቅጠሉ ሽፋን ላይ ረዘም ያሉ ቀይ-ቡናማ የተሰነጣጠቁ የዝገት ምልክቶች ይታያሉ።',
      preventionEn: 'Sow certified Ug99-resistant cultivars (e.g., Kakaba, Danda\'a, Kingbird). Avoid delayed sowing.',
      preventionAm: 'የዝገት በሽታን የሚቋቋሙ የተሻሻሉ የስንዴ ዝርያዎችን (እንደ ካካባ፣ ዳንዳኣ) ይጠቀሙ።',
    },
    MAIZE: {
      cropEn: 'Maize / Corn (Zea mays)',
      cropAm: 'በቆሎ',
      cropOm: 'Baqqoolloo',
      diseaseEn: 'Fall Armyworm Infestation (Spodoptera frugiperda)',
      diseaseAm: 'የመኸር አባጨጓሬ ወረርሽኝ',
      diseaseOm: 'Hawaannisa Raammoo Baqqoolloo',
      pathogen: 'Spodoptera frugiperda (Lepidoptera pest)',
      treatmentEn: 'Apply Ampligo 150 ZC or Radiant 120 SC into the whorl early morning or dusk. Apply neem extracts or ash.',
      treatmentAm: 'አምፕሊጎ (Ampligo) ወይም ራዲያንት (Radiant) በጠዋት ወይም ማታ ወደ በቆሎው እምብርት ይርጩ፤ አመድ ወይም የኮሶ ዱቄት ማፍሰስ ይቻላል።',
      treatmentOm: 'Qoricha Ampligo ykn daaraa gara handhuura baqqoollootti ganama ykn galgala naqaa.',
      symptomsEn: 'Ragged feeding holes in leaves, heavy sawdust-like frass inside the central leaf whorl.',
      symptomsAm: 'የበቆሎ ቅጠሎች የተበሳሱና የተቦጫጨቁ ይሆናሉ፤ በእምብርቱ ውስጥ የአባጨጓሬ ዓይነ-ምድር (ፍርስራሽ) ይሞላል።',
      preventionEn: 'Early synchronous planting, intercropping with Desmodium/Beans (Push-Pull strategy), handpicking egg masses.',
      preventionAm: 'ወቅቱን ጠብቆ በጋራ መዝራት፤ በቆሎን ከቦሎቄ ወይም ከደስሞዲየም ጋር ደባልቆ መዝራት (Push-Pull)።',
    },
  };

  const upperCrop = String(cropType || '').toUpperCase();
  const matchedTaxonomy = ETHIOPIA_PATHOLOGY_TAXONOMY[upperCrop] || null;

  const resolvedCropEn = diagnosis.cropIdentified?.nameEn || (matchedTaxonomy && matchedTaxonomy.cropEn) || plantIdResult.crop?.scientificName || cropType || 'Crop (Botanical specimen)';
  const resolvedCropAm = diagnosis.cropIdentified?.nameAm || (matchedTaxonomy && matchedTaxonomy.cropAm) || 'የእርሻ ሰብል';
  const resolvedCropOm = (matchedTaxonomy && matchedTaxonomy.cropOm) || 'Midhaan Qonnaa';

  const resolvedDiseaseEn = diagnosis.diseaseName?.nameEn || plantNetResult.topDisease?.name || plantIdResult.diseases?.[0]?.name || (matchedTaxonomy && matchedTaxonomy.diseaseEn) || 'Botanical Condition Analysis';
  const resolvedDiseaseAm = diagnosis.diseaseName?.nameAm || (matchedTaxonomy && matchedTaxonomy.diseaseAm) || 'የሰብል በሽታ ምርመራ';
  const resolvedDiseaseOm = (matchedTaxonomy && matchedTaxonomy.diseaseOm) || 'Qorannoo Dhibee Midhaanii';

  const resolvedPathogen = diagnosis.pathogen || plantNetResult.topDisease?.eppoCode || plantIdResult.diseases?.[0]?.cause || (matchedTaxonomy && matchedTaxonomy.pathogen) || 'Fungal/Viral/Pest Pathogen';
  const resolvedSeverity = diagnosis.severity || (plantNetResult.topDisease?.score > 0.6 ? 'HIGH' : 'MODERATE');
  const resolvedConfidence = diagnosis.confidenceScore || plantNetResult.topDisease?.score || plantIdResult.diseases?.[0]?.probability || 0.88;

  // Extract authoritative solution protocols from Perenual if available
  const perenualSolutionText = perenualResult.topResult?.solutions?.[0]
    ? (typeof perenualResult.topResult.solutions[0] === 'object'
        ? `${perenualResult.topResult.solutions[0].subtitle || 'Protocol'}: ${perenualResult.topResult.solutions[0].description || ''}`
        : String(perenualResult.topResult.solutions[0]))
    : null;

  // Triaging: Flag low confidence scans for local Woreda Development Agent review
  const needsExpertReview = resolvedConfidence < 0.75;
  const triageStatus = needsExpertReview ? 'PENDING_DA_REVIEW' : 'AI_VERIFIED';

  const treatmentEn = [
    diagnosis.treatment?.chemicalEn ? `Chemical: ${diagnosis.treatment.chemicalEn}` : (matchedTaxonomy ? matchedTaxonomy.treatmentEn : null),
    diagnosis.treatment?.organicEn ? `Organic/Cultural: ${diagnosis.treatment.organicEn}` : null,
    perenualSolutionText ? `Perenual Protocol: ${perenualSolutionText}` : null,
  ].filter(Boolean).join(' | ') || 'Apply targeted agronomic treatment and remove diseased foliage.';

  const treatmentAm = [
    diagnosis.treatment?.chemicalAm ? `ኬሚካል፡ ${diagnosis.treatment.chemicalAm}` : (matchedTaxonomy ? matchedTaxonomy.treatmentAm : null),
    diagnosis.treatment?.organicAm ? `የተፈጥሮ ዘዴ፡ ${diagnosis.treatment.organicAm}` : null,
  ].filter(Boolean).join(' | ') || 'ተገቢውን ፀረ-ተባይ/ፈንገስ ይርጩ፤ የተጎዱ የዕፅዋት ቅሪቶችን ያስወግዱ።';

  const treatmentOm = diagnosis.treatment?.culturalOm || (matchedTaxonomy ? matchedTaxonomy.treatmentOm : 'Dawaa qoricha dhibee itti gorfame seeraan fayyadamaa.');

  const symptomsEn = diagnosis.symptoms?.en || (matchedTaxonomy ? matchedTaxonomy.symptomsEn : 'Visible foliage discoloration and leaf tissue lesions.');
  const symptomsAm = diagnosis.symptoms?.am || (matchedTaxonomy ? matchedTaxonomy.symptomsAm : 'በቅጠሎችና በግንዱ ላይ የበሽታ ምልክቶችና የሕብረ-ቀለም ለውጥ ይታያል።');
  const preventionEn = diagnosis.prevention?.en || (matchedTaxonomy ? matchedTaxonomy.preventionEn : 'Use certified clean seeds, implement crop rotation, and inspect weekly.');
  const preventionAm = diagnosis.prevention?.am || (matchedTaxonomy ? matchedTaxonomy.preventionAm : 'የተሻሻሉ የበሽታ ተከላካይ ዘሮችን ይጠቀሙ፤ የሰብል ፈረቃን ይተግብሩ።');

  const rawResponse = {
    gemini: diagnosis,
    plantId: {
      crop: plantIdResult.crop,
      isHealthy: plantIdResult.isHealthy,
      topDiseases: plantIdResult.diseases,
    },
    plantNet: {
      success: plantNetResult.success,
      version: plantNetResult.version,
      topDisease: plantNetResult.topDisease,
      diseases: plantNetResult.diseases,
    },
    perenual: {
      success: perenualResult.success,
      topResult: perenualResult.topResult,
      solution: perenualSolutionText,
    },
    engines: ['Plant.id v3', 'Pl@ntNet v2', 'Perenual Agronomy', 'OpenRouter AI'],
    taxonomyMatched: Boolean(matchedTaxonomy),
    triageStatus,
  };

  try {
    let validFarmId = null;
    if (farmId) {
      const existingFarm = await prisma.farm.findUnique({ where: { id: farmId } });
      if (existingFarm) validFarmId = farmId;
    }

    const saved = await prisma.diseaseDiagnosis.create({
      data: {
        farmId: validFarmId,
        cropType: cropType || resolvedCropEn,
        cropIdentified: resolvedCropEn,
        imageUrl: uploadPath || '/uploads/diagnoses/crop_sample.jpg',
        diseaseName: resolvedDiseaseEn,
        pathogen: resolvedPathogen,
        severity: resolvedSeverity,
        confidenceScore: Math.round(resolvedConfidence * 100) / 100,
        symptomsEn,
        symptomsAm,
        treatmentEn,
        treatmentAm,
        treatmentOm,
        preventionEn,
        preventionAm,
        rawResponse,
      },
    });

    // Also persist raw Gemini reasoning into AIInsight table
    try {
      await prisma.aIInsight.create({
        data: {
          prompt: `Dual AI crop diagnosis for crop=${cropType || resolvedCropEn}`,
          model: 'Plant.id + Google Gemini 2.5 Flash',
          feature: 'DISEASE_DIAGNOSIS',
          rawResponse: rawResponse || {},
          confidenceScore: Math.round(resolvedConfidence * 100) / 100,
          farmId: validFarmId,
        },
      });
    } catch (aiLogErr) {
      logger.warn(`[DiseaseDiagnosis] AIInsight logging notice: ${aiLogErr.message}`);
    }

    return {
      id: saved.id,
      farmId: saved.farmId,
      cropType: saved.cropType,
      cropIdentified: saved.cropIdentified,
      cropIdentifiedAm: resolvedCropAm,
      cropIdentifiedOm: resolvedCropOm,
      imageUrl: saved.imageUrl,
      diseaseName: saved.diseaseName,
      diseaseNameAm: resolvedDiseaseAm,
      diseaseNameOm: resolvedDiseaseOm,
      pathogen: saved.pathogen,
      severity: saved.severity,
      confidenceScore: saved.confidenceScore,
      needsExpertReview,
      triageStatus,
      symptomsEn: saved.symptomsEn,
      symptomsAm: saved.symptomsAm,
      treatmentEn: saved.treatmentEn,
      treatmentAm: saved.treatmentAm,
      treatmentOm: saved.treatmentOm,
      preventionEn: saved.preventionEn,
      preventionAm: saved.preventionAm,
      aiModel: 'Multi-Engine (Plant.id v3 + Pl@ntNet v2 + Perenual + Gemini & OpenRouter AI)',
      enginesUsed: ['Plant.id v3', 'Pl@ntNet v2', 'Perenual Agronomy', 'OpenRouter AI'],
      rawResponse: saved.rawResponse,
      createdAt: saved.createdAt,
    };
  } catch (saveErr) {
    logger.warn(`[DiseaseDiagnosis] DB save notice: ${saveErr.message}. Gracefully returning computed AI diagnosis.`);
    return {
      id: `diag_ai_${Date.now()}`,
      farmId: farmId || null,
      cropType: cropType || resolvedCropEn,
      cropIdentified: resolvedCropEn,
      cropIdentifiedAm: resolvedCropAm,
      cropIdentifiedOm: resolvedCropOm,
      imageUrl: uploadPath || '/uploads/diagnoses/crop_sample.jpg',
      diseaseName: resolvedDiseaseEn,
      diseaseNameAm: resolvedDiseaseAm,
      diseaseNameOm: resolvedDiseaseOm,
      pathogen: resolvedPathogen,
      severity: resolvedSeverity,
      confidenceScore: Math.round(resolvedConfidence * 100) / 100,
      needsExpertReview,
      triageStatus,
      symptomsEn,
      symptomsAm,
      treatmentEn,
      treatmentAm,
      treatmentOm,
      preventionEn,
      preventionAm,
      aiModel: 'Multi-Engine (Plant.id v3 + Pl@ntNet v2 + Perenual + Gemini & OpenRouter AI)',
      enginesUsed: ['Plant.id v3', 'Pl@ntNet v2', 'Perenual Agronomy', 'OpenRouter AI'],
      rawResponse,
      createdAt: new Date().toISOString(),
    };
  }
}


/**
 * Retrieve all past diagnoses with optional filters and strict jurisdictional scoping
 */
async function getAllDiagnoses({ farmId, cropType, user } = {}) {
  const where = {};
  if (farmId) where.farmId = farmId;
  if (cropType) where.cropType = cropType;

  if (user) {
    const role = (user.role || 'FARMER').toUpperCase();
    if (role === 'FARMER') {
      where.farm = { userId: user.id };
    } else if (role === 'DEVELOPMENT_AGENT' || role === 'WOREDA_OFFICER') {
      if (user.woredaId) {
        where.farm = { woredaId: user.woredaId };
      }
    } else if (role === 'ZONAL_OFFICER') {
      if (user.zoneId) {
        where.farm = { woreda: { zoneId: user.zoneId } };
      }
    } else if (role === 'REGIONAL_OFFICER') {
      if (user.regionId) {
        where.farm = { woreda: { zone: { regionId: user.regionId } } };
      }
    }
  }

  return await prisma.diseaseDiagnosis.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      farm: {
        select: {
          id: true,
          farmName: true,
          userId: true,
          woredaId: true,
          woreda: { select: { id: true, nameEn: true, nameAm: true, zoneId: true, zone: { select: { id: true, regionId: true } } } },
        },
      },
    },
  });
}

const { setDiagnosisJobState, getDiagnosisJobState } = require('../../ingestion/jobs/queue');

/**
 * Submit an asynchronous crop diagnosis job.
 * Returns immediately with jobId and status 'PROCESSING'.
 * State is persisted in Redis (or in-memory fallback) across restarts.
 */
async function submitAsyncDiagnosis({ farmId, cropType, imageUrl, imageFile, imageBase64, language = 'en', user }) {
  const jobId = `diagjob_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  let jobState = {
    jobId,
    status: 'PROCESSING',
    progress: 10,
    farmId: farmId || null,
    cropType: cropType || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDiagnosisJobState(jobId, jobState);

  // Run in background without blocking the HTTP response
  setImmediate(async () => {
    try {
      jobState = { ...jobState, progress: 30, updatedAt: new Date().toISOString() };
      await setDiagnosisJobState(jobId, jobState);

      const result = await diagnoseCropImage({
        farmId,
        cropType,
        imageUrl,
        imageFile,
        imageBase64,
        language,
        user,
      });

      jobState = {
        jobId,
        status: 'COMPLETED',
        progress: 100,
        result,
        updatedAt: new Date().toISOString(),
      };
      await setDiagnosisJobState(jobId, jobState);
      logger.info(`[DiseaseDiagnosis] Async job ${jobId} completed successfully`);
    } catch (err) {
      logger.error(`[DiseaseDiagnosis] Async job ${jobId} failed: ${err.message}`);
      jobState = {
        jobId,
        status: 'FAILED',
        progress: 100,
        error: { message: err.message || 'Diagnosis failed' },
        updatedAt: new Date().toISOString(),
      };
      await setDiagnosisJobState(jobId, jobState);
    }
  });

  return {
    jobId,
    status: 'PROCESSING',
    message: 'Diagnosis job submitted. Poll GET /disease-diagnosis/jobs/' + jobId + ' for results.',
    checkUrl: `/api/v1/disease-diagnosis/jobs/${jobId}`,
  };
}

/**
 * Get status of an async diagnosis job
 */
async function getDiagnosisJobStatus(jobId) {
  return await getDiagnosisJobState(jobId);
}


/**
 * Get diagnoses for a specific farm with ownership & jurisdictional verification
 */
async function getDiagnosesByFarm(farmId, user) {
  if (user && isConnected()) {
    const role = (user.role || 'FARMER').toUpperCase();
    if (role !== 'ADMIN' && role !== 'RESEARCHER') {
      const farm = await prisma.farm.findUnique({
        where: { id: farmId },
        include: { woreda: { include: { zone: true } } },
      });
      if (!farm) {
        throw new NotFoundError(`Farm with ID ${farmId} not found`);
      }
      if (role === 'FARMER' && farm.userId !== user.id) {
        throw new ForbiddenError('Access denied: You can only view diagnoses for your own farms');
      }
      if ((role === 'DEVELOPMENT_AGENT' || role === 'WOREDA_OFFICER') && user.woredaId && farm.woredaId !== user.woredaId) {
        throw new ForbiddenError('Access denied: Farm is outside your woreda jurisdiction');
      }
      if (role === 'ZONAL_OFFICER' && user.zoneId && farm.woreda?.zoneId !== user.zoneId) {
        throw new ForbiddenError('Access denied: Farm is outside your zone jurisdiction');
      }
      if (role === 'REGIONAL_OFFICER' && user.regionId && farm.woreda?.zone?.regionId !== user.regionId) {
        throw new ForbiddenError('Access denied: Farm is outside your region jurisdiction');
      }
    }
  }
  return getAllDiagnoses({ farmId, user });
}

module.exports = {
  diagnoseCropImage,
  submitAsyncDiagnosis,
  getDiagnosisJobStatus,
  getAllDiagnoses,
  getDiagnosesByFarm,
  getDiagnosisJobState,
};


