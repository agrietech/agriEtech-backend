const express = require('express');
const router = express.Router();
const controller = require('./ussdMenu.controller');

router.post('/', controller.handleUssdSession);
router.get('/', (_req, res) => res.json({ status: 'OK', service: 'USSD Gateway' }));

module.exports = router;
