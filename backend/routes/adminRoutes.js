const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Get all admins
router.get('/', adminController.getAllAdmins);

// Get an admin by ID
router.get('/:id', adminController.getAdminById);

// Create a new admin
router.post('/', adminController.createAdmin);

// Update an admin
router.put('/:id', adminController.updateAdmin);

// Delete an admin
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;
