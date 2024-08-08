const express = require("express");
const router = express.Router();

const {
    getDrivers,
    getDriverById,
    saveDriver,
    updateDriver,
    editDriverActivatedStatus,
    deleteDriver
} = require('../controllers/DriverController.js');



// Routes pour les fonctionnalités de base des médecins
router.get('/Drivers', getDrivers);
router.get('/Drivers/:id', getDriverById);
router.post('/Drivers', saveDriver);
router.patch('/Drivers/:id', updateDriver);
router.delete('/Drivers/:id', deleteDriver);

// Route pour obtenir l'état "activated" d'un utilisateur


// Route pour éditer l'état "activated" d'un utilisateur
router.patch('/Drivers/:User_id/activated', editDriverActivatedStatus);

module.exports = router;
