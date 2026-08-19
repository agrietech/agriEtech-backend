const express = require('express');
const router = express.Router();
const controller = require('./diseaseDiagnosis.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload');

router.get('/', authenticate, controller.getAllDiagnoses);
router.get('/farm/:farmId', authenticate, controller.getDiagnosesByFarm);
router.post('/diagnose', authenticate, upload.single('image'), controller.diagnose);

module.exports = router;
