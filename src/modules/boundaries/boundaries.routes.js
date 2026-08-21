const express = require('express');
const router = express.Router();
const controller = require('./boundaries.controller');
const { setCacheHeaders } = require('../../middleware/cacheControl');

// Cache boundary data for 1 hour (rarely changes)
router.get('/regions', setCacheHeaders(3600), controller.getRegions);
router.get('/zones', setCacheHeaders(3600), controller.getZones);
router.get('/woredas', setCacheHeaders(3600), controller.getWoredas);
router.get('/woredas/:id', setCacheHeaders(3600), controller.getWoredaDetails);

module.exports = router;
