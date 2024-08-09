const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');

// Get all drivers
router.get('/', driverController.getAllDrivers);

// Get a driver by ID
router.get('/:id', driverController.getDriverById);

// Create a new driver
router.post('/', driverController.createDriver);

// Update a driver
router.put('/:id', driverController.updateDriver);

// Delete a driver
router.delete('/:id', driverController.deleteDriver);

module.exports = router;

