const express = require('express');
const router = express.Router();
const controller = require('./boundaries.controller');

router.get('/regions', controller.getRegions);
router.get('/woredas', controller.getWoredas);
router.get('/woredas/:id', controller.getWoredaDetails);

module.exports = router;
