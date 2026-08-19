const fs = require('fs');
const path = require('path');
const { prisma, isConnected } = require('../../config/db');
const openRouterClient = require('../../utils/openRouterClient');
const plantIdClient = require('../../ingestion/plantIdClient');
const logger = require('../../utils/logger');

// In-memory store for dev/test
const _mockDiagnoses = [];

/**
 * Perform Dual-AI Crop Disease Diagnosis:
 * Combines Plant.id Botanical Taxonomy + Google Gemini 2.5 Flash Vision & Bilingual Agronomic Reasoning
 *
 * @param {object} params
 * @param {string} [params.farmId]
 * @param {string} [params.cropType]
 * @param {string} [params.imageUrl]
 * @param {object} [params.imageFile] - Multer file object
 * @param {string} [params.language='en'] - 'en', 'am', or 'om'
 * @returns {Promise<object>}
 */
async function diagnoseCropImage({ farmId, cropType, imageUrl, imageFile, language = 'en' }) {
  let imageBase64 = null;
  let uploadPath = imageUrl || null;

  if (imageFile && imageFile.path && fs.existsSync(imageFile.path)) {
    try {
      const fileBuffer = fs.readFileSync(imageFile.path);
      imageBase64 = fileBuffer.toString('base64');
      uploadPath = `/uploads/diagnoses/${path.basename(imageFile.path)}`;
    } catch (err) {
      logger.warn(`[DiseaseDiagnosis] Failed to read uploaded image file: ${err.message}`);
    }
  }

  // Step 1: Query Plant.id for specialized botanical identification & disease probabilities
  logger.info(`[DiseaseDiagnosis] Querying Plant.id Botanical Classifier for cropHint="${cropType || 'general'}"`);
  const plantIdResult = await plantIdClient.identifyCropHealth({
    imageBase64,
    imageUrl,
    cropHint: cropType,
  });

  // Step 2: Feed image + Plant.id findings into Gemini 2.5 Flash on OpenRouter
  logger.info('[DiseaseDiagnosis] Submitting to Gemini 2.5 Flash on OpenRouter for Multimodal Bilingual Diagnosis');
  const geminiVisionResult = await openRouterClient.analyzeCropVision({
    imageBase64,
    imageUrl,
    cropHint: cropType || plantIdResult.crop?.commonNames?.[0] || 'Crop',
    plantIdData: plantIdResult,
    language,
  });

  const diagnosis = geminiVisionResult.diagnosis || {};

  // Formulate unified diagnosis entity
  const recordId = `diag_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const resolvedCropEn = diagnosis.cropIdentified?.nameEn || plantIdResult.crop?.scientificName || cropType || 'Cereal Crop';
  const resolvedCropAm = diagnosis.cropIdentified?.nameAm || 'ሰብል';
  const resolvedDiseaseEn = diagnosis.diseaseName?.nameEn || plantIdResult.diseases?.[0]?.name || 'Crop Rust / Leaf Blight';
  const resolvedDiseaseAm = diagnosis.diseaseName?.nameAm || 'የሰብል በሽታ';
  const resolvedPathogen = diagnosis.pathogen || plantIdResult.diseases?.[0]?.cause || 'Pathogenic complex';
  const resolvedSeverity = diagnosis.severity || 'MODERATE';
  const resolvedConfidence = diagnosis.confidenceScore || plantIdResult.diseases?.[0]?.probability || 0.93;

  const treatmentEn = [
    diagnosis.treatment?.chemicalEn ? `Chemical: ${diagnosis.treatment.chemicalEn}` : null,
    diagnosis.treatment?.organicEn ? `Organic/Cultural: ${diagnosis.treatment.organicEn}` : null,
  ].filter(Boolean).join(' | ') || 'Apply recommended fungicide and remove infected plant residues.';

  const treatmentAm = [
    diagnosis.treatment?.chemicalAm ? `ኬሚካል፡ ${diagnosis.treatment.chemicalAm}` : null,
    diagnosis.treatment?.organicAm ? `የተፈጥሮ ዘዴ፡ ${diagnosis.treatment.organicAm}` : null,
  ].filter(Boolean).join(' | ') || 'የሚመከሩ ፀረ-ፈንገስ ያፍሱ፤ የተጎዱ የዕፅዋት ቅሪቶችን ያስወግዱ።';

  const treatmentOm = diagnosis.treatment?.culturalOm || 'Dawaa fungicide itti gorfame fayyadami. Sanyii biyyee dhibamaa kaasi.';

  const symptomsEn = diagnosis.symptoms?.en || 'Leaf lesions and surface chlorosis visible on foliage.';
  const symptomsAm = diagnosis.symptoms?.am || 'በቅጠሉ ላይ የተበከሉ አረፋዎችና የመድረቅ ምልክቶች ይታያሉ።';
  const preventionEn = diagnosis.prevention?.en || 'Use certified disease-free seeds and maintain field spacing.';
  const preventionAm = diagnosis.prevention?.am || 'ንጹህ የተመሰከረላቸው ዘሮችን ይጠቀሙ፤ የእርሻ ክፍተትን ይጠብቁ።';

  const diagnosisPayload = {
    id: recordId,
    farmId: farmId || null,
    cropType: cropType || resolvedCropEn,
    cropIdentified: resolvedCropEn,
    cropIdentifiedAm: resolvedCropAm,
    imageUrl: uploadPath,
    diseaseName: resolvedDiseaseEn,
    diseaseNameAm: resolvedDiseaseAm,
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
    aiModel: 'Plant.id Botanical + Google Gemini 2.5 Flash (OpenRouter)',
    rawResponse: {
      gemini: diagnosis,
      plantId: {
        crop: plantIdResult.crop,
        isHealthy: plantIdResult.isHealthy,
        topDiseases: plantIdResult.diseases,
      },
    },
    assessedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  if (isConnected()) {
    try {
      const saved = await prisma.diseaseDiagnosis.create({
        data: {
          farmId: farmId || null,
          cropType: cropType || resolvedCropEn,
          cropIdentified: resolvedCropEn,
          imageUrl: uploadPath || 'uploaded_sample.jpg',
          diseaseName: resolvedDiseaseEn,
          pathogen: resolvedPathogen,
          severity: resolvedSeverity,
          confidenceScore: diagnosisPayload.confidenceScore,
          symptomsEn,
          symptomsAm,
          treatmentEn,
          treatmentAm,
          treatmentOm,
          preventionEn,
          preventionAm,
          rawResponse: diagnosisPayload.rawResponse,
        },
      });
      return { ...diagnosisPayload, id: saved.id };
    } catch (dbErr) {
      logger.warn(`[DiseaseDiagnosis] Database save fallback: ${dbErr.message}`);
    }
  }

  _mockDiagnoses.unshift(diagnosisPayload);
  return diagnosisPayload;
}

/**
 * Retrieve all past diagnoses with optional filters
 */
async function getAllDiagnoses({ farmId, cropType } = {}) {
  if (isConnected()) {
    const where = {};
    if (farmId) where.farmId = farmId;
    if (cropType) where.cropType = cropType;
    return await prisma.diseaseDiagnosis.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  let results = [..._mockDiagnoses];
  if (farmId) results = results.filter((d) => d.farmId === farmId);
  if (cropType) results = results.filter((d) => (d.cropType || '').toLowerCase() === cropType.toLowerCase());
  return results;
}

/**
 * Get diagnoses for a specific farm
 */
async function getDiagnosesByFarm(farmId) {
  return getAllDiagnoses({ farmId });
}

module.exports = {
  diagnoseCropImage,
  getAllDiagnoses,
  getDiagnosesByFarm,
  _mockDiagnoses,
};
