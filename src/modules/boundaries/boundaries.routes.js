const express = require('express');
const router = express.Router();
const controller = require('./boundaries.controller');
const { setCacheHeaders } = require('../../middleware/cache-control.middleware');
const { optionalAuthenticate } = require('../../middleware/auth.middleware');

// Administrative boundary data is intentionally public for map rendering and
// coordinate resolution use cases (e.g., Flutter map, USSD location lookup).
// optionalAuthenticate attaches user context when a token is present — enabling
// future audit logging and personalized scope responses — while not blocking
// unauthenticated access to the reference data.
router.get('/regions', optionalAuthenticate, setCacheHeaders(3600), controller.getRegions);
router.get('/zones', optionalAuthenticate, setCacheHeaders(3600), controller.getZones);
router.get('/woredas', optionalAuthenticate, setCacheHeaders(3600), controller.getWoredas);
router.get('/woredas/:id', optionalAuthenticate, setCacheHeaders(3600), controller.getWoredaDetails);
router.get('/kebeles', optionalAuthenticate, setCacheHeaders(3600), controller.getKebeles);
router.get('/kebeles/:id', optionalAuthenticate, setCacheHeaders(3600), controller.getKebeleDetails);
router.get('/hierarchy', optionalAuthenticate, setCacheHeaders(3600), controller.getHierarchy);
router.get('/summary', optionalAuthenticate, setCacheHeaders(3600), controller.getNationalSummary);
router.get('/resolve-coords', optionalAuthenticate, controller.resolveCoordinates);

module.exports = router;
