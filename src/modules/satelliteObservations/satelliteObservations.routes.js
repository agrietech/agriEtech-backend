const express = require('express');
const router = express.Router();
const controller = require('./satelliteObservations.controller');

router.get('/', controller.getObservations);

module.exports = router;
