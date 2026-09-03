const express = require('express');
const router = express.Router();
const controller = require('./satelliteObservations.controller');
const { authenticate, authorizeWoredaScope } = require('../../middleware/auth.middleware');

router.get('/woreda/:woredaId', authenticate, authorizeWoredaScope('woredaId'), controller.getObservations);
router.get('/', authenticate, authorizeWoredaScope('woredaId'), controller.getObservations);

module.exports = router;
