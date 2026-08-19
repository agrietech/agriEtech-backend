const express = require('express');
const router = express.Router();
const controller = require('./satelliteObservations.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.get('/woreda/:woredaId', authenticate, controller.getObservations);
router.get('/', authenticate, controller.getObservations);

module.exports = router;
