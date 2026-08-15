const express = require('express');
const router = express.Router();
const controller = require('./diseaseDiagnosis.controller');

router.post('/diagnose', controller.diagnose);
router.post('/', controller.diagnose);

module.exports = router;
