const express = require('express');
const router = express.Router();
const controller = require('./diseaseDiagnosis.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload.middleware');

const { aiLimiter } = require('../../middleware/rate-limiter.middleware');

router.get('/', authenticate, controller.getAllDiagnoses);
router.get('/farm/:farmId', authenticate, controller.getDiagnosesByFarm);
router.get('/jobs/:jobId', authenticate, controller.getJobStatus);
router.get('/status/:jobId', authenticate, controller.getJobStatus);
router.post('/diagnose', authenticate, aiLimiter, upload.single('image'), controller.diagnose);

module.exports = router;

