// routes/qrCodeRoutes.js
const express = require('express');
const router = express.Router();
const qrCodeController = require('../controllers/qrCodeController');

router.post('/generate', qrCodeController.generateQrCode);
router.post('/generateDriver', qrCodeController.generateQrCodeDriver);
router.post('/verify', qrCodeController.verifyQrCode);

module.exports = router;
