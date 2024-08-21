// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Route to get all services
router.get('/', serviceController.getServices);

// Route to create a service (for testing)
router.post('/', serviceController.createService);

module.exports = router;
