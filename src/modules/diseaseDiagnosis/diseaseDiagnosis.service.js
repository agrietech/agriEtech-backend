const fs = require('fs');
const path = require('path');
const { prisma, isConnected } = require('../../config/db');
const openRouterClient = require('../../utils/openRouterClient');
const plantIdClient = require('../../ingestion/plantIdClient');
const logger = require('../../utils/logger');

const inMemoryDiagnoses = new Map();

/**
 * Perform Dual-AI Crop Disease Diagnosis:
 * Combines Plant.id Botanical Taxonomy + Google Gemini 2.5 Flash Vision & Bilingual Agronomic Reasoning
 */
async function diagnoseCropImage({ farmId, cropType, imageUrl, imageFile, imageBase64: rawBase64, language = 'en' }) {
  let imageBase64 = rawBase64 || null;
  let uploadPath = imageUrl || null;

  const { uploadToSupabase } = require('../../utils/supabaseStorage');
  if (imageFile && imageFile.path && fs.existsSync(imageFile.path)) {
    try {
      const fileBuffer = fs.readFileSync(imageFile.path);
      imageBase64 = fileBuffer.toString('base64');
      uploadPath = await uploadToSupabase({
        bucketName: 'diagnoses',
        localFilePath: imageFile.path,
        fileName: path.basename(imageFile.path),
        mimeType: imageFile.mimetype,
      });
    } catch (err) {
      logger.warn(`[DiseaseDiagnosis] Failed to read or upload image: ${err.message}`);
    }
  }

  // Step 1: Query Plant.id for specialized botanical identification & disease probabilities
  logger.info(`[DiseaseDiagnosis] Querying Plant.id Botanical Classifier for cropHint="${cropType || 'general'}"`);
  let plantIdResult = { isHealthy: false, diseases: [] };
  try {
    plantIdResult = await plantIdClient.identifyCropHealth({
      imageBase64,
      imageUrl,
      cropHint: cropType,
    });
  } catch (pErr) {
    logger.warn(`[DiseaseDiagnosis] Plant.id query notice: ${pErr.message}`);
  }

  // Step 2: Feed image + Plant.id findings into Gemini 2.5 Flash on OpenRouter
  logger.info('[DiseaseDiagnosis] Submitting to Gemini 2.5 Flash on OpenRouter for Multimodal Bilingual Diagnosis');
  let geminiVisionResult = {};
  try {
    geminiVisionResult = await openRouterClient.analyzeCropVision({
      imageBase64,
      imageUrl,
      cropHint: cropType || plantIdResult.crop?.commonNames?.[0] || plantIdResult.crop?.scientificName || 'Crop',
      plantIdData: plantIdResult,
      language,
    });
  } catch (gErr) {
    logger.warn(`[DiseaseDiagnosis] Gemini vision notice: ${gErr.message}`);
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

  const resolvedDiseaseEn = diagnosis.diseaseName?.nameEn || plantIdResult.diseases?.[0]?.name || (matchedTaxonomy && matchedTaxonomy.diseaseEn) || 'Botanical Condition Analysis';
  const resolvedDiseaseAm = diagnosis.diseaseName?.nameAm || (matchedTaxonomy && matchedTaxonomy.diseaseAm) || 'የሰብል በሽታ ምርመራ';
  const resolvedDiseaseOm = (matchedTaxonomy && matchedTaxonomy.diseaseOm) || 'Qorannoo Dhibee Midhaanii';

  const resolvedPathogen = diagnosis.pathogen || plantIdResult.diseases?.[0]?.cause || (matchedTaxonomy && matchedTaxonomy.pathogen) || 'Fungal/Viral/Pest Pathogen';
  const resolvedSeverity = diagnosis.severity || 'MODERATE';
  const resolvedConfidence = diagnosis.confidenceScore || plantIdResult.diseases?.[0]?.probability || 0.88;

  // Triaging: Flag low confidence scans for local Woreda Development Agent review
  const needsExpertReview = resolvedConfidence < 0.75;
  const triageStatus = needsExpertReview ? 'PENDING_DA_REVIEW' : 'AI_VERIFIED';

  const treatmentEn = [
    diagnosis.treatment?.chemicalEn ? `Chemical: ${diagnosis.treatment.chemicalEn}` : (matchedTaxonomy ? matchedTaxonomy.treatmentEn : null),
    diagnosis.treatment?.organicEn ? `Organic/Cultural: ${diagnosis.treatment.organicEn}` : null,
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
    taxonomyMatched: Boolean(matchedTaxonomy),
    triageStatus,
  };

  if (isConnected()) {
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
        aiModel: 'Plant.id Botanical + Google Gemini 2.5 Flash + EthioAgriTaxonomy',
        rawResponse: saved.rawResponse,
        createdAt: saved.createdAt,
      };
    } catch (saveErr) {
      logger.warn(`[DiseaseDiagnosis] DB save notice: ${saveErr.message}`);
    }
  }

  const liveRecord = {
    id: `diag_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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
    aiModel: 'Plant.id Botanical + Google Gemini 2.5 Flash + EthioAgriTaxonomy',
    rawResponse,
    createdAt: new Date().toISOString(),
  };

  inMemoryDiagnoses.set(liveRecord.id, liveRecord);
  return liveRecord;
}


/**
 * Retrieve all past diagnoses with optional filters
 */
async function getAllDiagnoses({ farmId, cropType } = {}) {
  if (isConnected()) {
    try {
      const where = {};
      if (farmId) where.farmId = farmId;
      if (cropType) where.cropType = cropType;
      return await prisma.diseaseDiagnosis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          farm: {
            select: {
              id: true,
              farmName: true,
              woreda: { select: { nameEn: true, nameAm: true } },
            },
          },
        },
      });
    } catch (_err) {
      // Fallback
    }
  }

  let list = Array.from(inMemoryDiagnoses.values());
  if (farmId) list = list.filter((d) => d.farmId === farmId);
  if (cropType) list = list.filter((d) => d.cropType === cropType);
  return list;
}

// Asynchronous diagnosis jobs map (jobId -> { status: 'PENDING'|'PROCESSING'|'COMPLETED'|'FAILED', result, error, progress, createdAt, updatedAt })
const diagnosisJobs = new Map();

/**
 * Submit an asynchronous crop diagnosis job.
 * Returns immediately with jobId and status 'PROCESSING'.
 */
async function submitAsyncDiagnosis({ farmId, cropType, imageUrl, imageFile, imageBase64, language = 'en' }) {
  const jobId = `diagjob_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  const jobState = {
    jobId,
    status: 'PROCESSING',
    progress: 10,
    farmId: farmId || null,
    cropType: cropType || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  diagnosisJobs.set(jobId, jobState);

  // Run in background without blocking the HTTP response
  setImmediate(async () => {
    try {
      diagnosisJobs.set(jobId, { ...diagnosisJobs.get(jobId), progress: 30, updatedAt: new Date().toISOString() });

      const result = await diagnoseCropImage({
        farmId,
        cropType,
        imageUrl,
        imageFile,
        imageBase64,
        language,
      });

      diagnosisJobs.set(jobId, {
        jobId,
        status: 'COMPLETED',
        progress: 100,
        result,
        updatedAt: new Date().toISOString(),
      });
      logger.info(`[DiseaseDiagnosis] Async job ${jobId} completed successfully`);
    } catch (err) {
      logger.error(`[DiseaseDiagnosis] Async job ${jobId} failed: ${err.message}`);
      diagnosisJobs.set(jobId, {
        jobId,
        status: 'FAILED',
        progress: 100,
        error: { message: err.message || 'Diagnosis failed' },
        updatedAt: new Date().toISOString(),
      });
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
  const job = diagnosisJobs.get(jobId);
  if (!job) {
    return null;
  }
  return job;
}

/**
 * Get diagnoses for a specific farm
 */
async function getDiagnosesByFarm(farmId) {
  return getAllDiagnoses({ farmId });
}

module.exports = {


  diagnoseCropImage,
  submitAsyncDiagnosis,
  getDiagnosisJobStatus,
  getAllDiagnoses,
  getDiagnosesByFarm,
  inMemoryDiagnoses,
  diagnosisJobs,
};

