const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');

// Get all drivers
router.get('/', driverController.getAllDrivers);
router.get('/diponible', driverController.getAvailableDrivers);
router.get('/forChart', driverController.getAvailableDriversForChart);

router.post('/commandeLivree', driverController.commandeLivree); 
router.post('/commandeRedestrubier', driverController.commandeRedistribuer); 
router.post('/commandeCanceled', driverController.commandeCanceled); 
router.post('/logout', driverController.logoutUser); 
router.post('/get-distance', driverController.getDistance);

// Get a driver by ID
router.get('/:id', driverController.getDriverById);

// Create a new driver
router.post('/', driverController.saveDriver);

// Update a driver
router.put('/:id', driverController.updateDriver);

// Delete a driver
router.delete('/:id', driverController.deleteDriver);

router.put('/delete/:id', driverController.deleteDriverFromAdmin);


router.post('/device', driverController.getDriverByDeviceId);

router.post('/updateAvailability', driverController.updateDriverAvailability);
router.post('/updatePause', driverController.updateDriverPause);

router.post('/revenue-orders', driverController.getDriverRevenueAndOrders);


module.exports = router;

