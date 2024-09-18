const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');

// Get all drivers
router.get('/', driverController.getAllDrivers);
router.get('/diponible', driverController.getAvailableDrivers);
router.post('/commandeLivree', driverController.commandeLivree); 

// Get a driver by ID
router.get('/:id', driverController.getDriverById);

// Create a new driver
router.post('/', driverController.saveDriver);

// Update a driver
router.put('/:id', driverController.updateDriver);

// Delete a driver
router.delete('/:id', driverController.deleteDriver);

router.post('/device', driverController.getDriverByDeviceId);

router.post('/updateAvailability', driverController.updateDriverAvailability);


module.exports = router;

