const express = require('express');
const router = express.Router();
const controller = require('./weather.controller');
const { optionalAuthenticate } = require('../../middleware/auth.middleware');

// Public / Authenticated weather forecast routes
router.get('/forecast', optionalAuthenticate, controller.getForecast);
router.get('/current', optionalAuthenticate, controller.getCurrentWeather);

module.exports = router;
