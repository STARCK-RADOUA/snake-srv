// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Route to get all services
router.get('/', serviceController.getServices);

router.get('/:id', serviceController.getServicebyid);

// Route to create a service (for testing)
router.post('/', serviceController.addService);

router.put('/update/:id', serviceController.updateService);

router.delete('/delete/:id', serviceController.deleteService);

module.exports = router;

