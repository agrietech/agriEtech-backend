const express = require('express');
const router = express.Router();
const controller = require('./cropProtection.controller');
const { optionalAuthenticate } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload.middleware');
const { aiLimiter } = require('../../middleware/rate-limiter.middleware');

// 1. Weed Detection & Herbicide Prescriptions
router.post('/weed/detect', optionalAuthenticate, aiLimiter, upload.single('image'), controller.detectWeed);
router.get('/weed/database', optionalAuthenticate, controller.getWeeds);

// 2. Spray Window Weather Advisory
router.get('/spray-window', optionalAuthenticate, controller.getSprayWindow);

// 3. Leaf Nutrient Deficiency Diagnostics
router.post('/nutrient/scan', optionalAuthenticate, aiLimiter, upload.single('image'), controller.scanNutrient);
router.get('/nutrient/database', optionalAuthenticate, controller.getNutrients);

// 4. Insect Pest Scout & Economic Threshold (ETL) Evaluator
router.post('/pest/scout', optionalAuthenticate, aiLimiter, upload.single('image'), controller.scoutPest);
router.get('/pest/database', optionalAuthenticate, controller.getPests);

// 5. Tank-Mix & Compatibility Validator
router.post('/tank-mix/validate', optionalAuthenticate, controller.validateTankMix);
router.get('/tank-mix/chemicals', optionalAuthenticate, controller.getAgrochemicals);

// 6. Seed Rate & Plant Population Calculator
router.post('/seed-calculator', optionalAuthenticate, controller.calculateSeed);
router.get('/seed-calculator/crops', optionalAuthenticate, controller.getCrops);

module.exports = router;
