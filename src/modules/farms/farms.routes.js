const express = require('express');
const router = express.Router();
const controller = require('./farms.controller');

router.post('/', controller.createFarm);
router.get('/', controller.getFarms);
router.get('/:id', controller.getFarmDetails);

module.exports = router;
