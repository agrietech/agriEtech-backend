const express = require('express');
const router = express.Router();
const controller = require('./cropProtection.controller');
const { authenticate, optionalAuthenticate } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload.middleware');
const { aiLimiter } = require('../../middleware/rate-limiter.middleware');

// Weed Detection — authenticate required to prevent AI cost amplification attacks
router.post('/weed/detect', authenticate, aiLimiter, upload.single('image'), controller.detectWeed);
// Database lookup endpoints are read-only reference data — optionalAuthenticate is fine
router.get('/weed/database', optionalAuthenticate, controller.getWeeds);

// Spray Window Advisor — location-based weather logic, optional auth (no AI cost)
router.get('/spray-window', optionalAuthenticate, controller.getSprayWindow);

// Nutrient Deficiency Scan — authenticate required (AI image analysis)
router.post('/nutrient/scan', authenticate, aiLimiter, upload.single('image'), controller.scanNutrient);
router.get('/nutrient/database', optionalAuthenticate, controller.getNutrients);

// Pest Scout — authenticate required (AI image analysis)
router.post('/pest/scout', authenticate, aiLimiter, upload.single('image'), controller.scoutPest);
router.get('/pest/database', optionalAuthenticate, controller.getPests);

// Tank Mix Compatibility — computation only, no AI cost — optionalAuthenticate acceptable
router.post('/tank-mix/validate', optionalAuthenticate, controller.validateTankMix);
router.get('/tank-mix/chemicals', optionalAuthenticate, controller.getAgrochemicals);

// Seed Rate Calculator — computation only, no AI cost — optionalAuthenticate acceptable
router.post('/seed-calculator', optionalAuthenticate, controller.calculateSeed);
router.get('/seed-calculator/crops', optionalAuthenticate, controller.getCrops);

module.exports = router;
