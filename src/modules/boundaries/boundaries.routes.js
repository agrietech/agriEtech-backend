const express = require('express');
const router = express.Router();
const controller = require('./boundaries.controller');
const { setCacheHeaders } = require('../../middleware/cache-control.middleware');

// Cache boundary data for 1 hour (rarely changes)
router.get('/regions', setCacheHeaders(3600), controller.getRegions);
router.get('/zones', setCacheHeaders(3600), controller.getZones);
router.get('/woredas', setCacheHeaders(3600), controller.getWoredas);
router.get('/woredas/:id', setCacheHeaders(3600), controller.getWoredaDetails);
router.get('/kebeles', setCacheHeaders(3600), controller.getKebeles);
router.get('/kebeles/:id', setCacheHeaders(3600), controller.getKebeleDetails);
router.get('/hierarchy', setCacheHeaders(3600), controller.getHierarchy);
router.get('/summary', setCacheHeaders(3600), controller.getNationalSummary);
router.get('/resolve-coords', controller.resolveCoordinates);

module.exports = router;

