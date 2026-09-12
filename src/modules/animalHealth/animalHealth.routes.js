const express = require('express');
const router = express.Router();
const controller = require('./animalHealth.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// All animal health routes require authentication
router.use(authenticate);

// Disease reference database (read-only, all roles)
router.get('/diseases', authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER', 'ZONAL_OFFICER', 'WOREDA_OFFICER', 'DEVELOPMENT_AGENT', 'FARMER'), controller.getDiseases);
router.get('/diseases/:diseaseId', authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER', 'ZONAL_OFFICER', 'WOREDA_OFFICER', 'DEVELOPMENT_AGENT', 'FARMER'), controller.getDiseaseDetails);

// Outbreak reporting and tracking
router.post('/outbreaks', authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER', 'ZONAL_OFFICER', 'WOREDA_OFFICER', 'DEVELOPMENT_AGENT'), controller.reportOutbreak);
router.get('/outbreaks', authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER', 'ZONAL_OFFICER', 'WOREDA_OFFICER', 'DEVELOPMENT_AGENT', 'FARMER'), controller.getOutbreaks);

// Livestock registry
router.post('/livestock', authorize('ADMIN', 'RESEARCHER', 'WOREDA_OFFICER', 'DEVELOPMENT_AGENT', 'FARMER'), controller.registerLivestock);
router.get('/livestock', authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER', 'ZONAL_OFFICER', 'WOREDA_OFFICER', 'DEVELOPMENT_AGENT', 'FARMER'), controller.getLivestock);

// Vaccination campaigns
router.post('/vaccinations', authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER', 'ZONAL_OFFICER', 'WOREDA_OFFICER', 'DEVELOPMENT_AGENT'), controller.recordVaccination);
router.get('/vaccinations', authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER', 'ZONAL_OFFICER', 'WOREDA_OFFICER', 'DEVELOPMENT_AGENT', 'FARMER'), controller.getVaccinationStatus);

// Pasture/forage condition (NDVI-based)
router.get('/pasture-condition', authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER', 'ZONAL_OFFICER', 'WOREDA_OFFICER', 'DEVELOPMENT_AGENT', 'FARMER'), controller.getPastureCondition);

// Combined animal health risk assessment
router.get('/risk-assessment', authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER', 'ZONAL_OFFICER', 'WOREDA_OFFICER', 'DEVELOPMENT_AGENT', 'FARMER'), controller.getRiskAssessment);

// Veterinary calendar
router.get('/vet-calendar', authorize('ADMIN', 'RESEARCHER', 'REGIONAL_OFFICER', 'ZONAL_OFFICER', 'WOREDA_OFFICER', 'DEVELOPMENT_AGENT', 'FARMER'), controller.getVetCalendar);

module.exports = router;
