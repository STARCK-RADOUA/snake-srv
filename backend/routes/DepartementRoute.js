const express = require('express');
const router = express.Router();
const DepartementController = require('../controllers/DepartementController');

router.post('/Adepartements', DepartementController.createDepartement);
router.get('/departements', DepartementController.getAllDepartements);
router.get('/departements/:id', DepartementController.getDepartementById);
router.patch('/Udepartements/:id', DepartementController.updateDepartement);
router.delete('/Ddepartements/:id', DepartementController.deleteDepartement);

module.exports = router;