const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

// Get all addresses
router.get('/', addressController.getAllAddresses);

// Get an address by ID
router.get('/:id', addressController.getAddressById);

// Create a new address
router.post('/', addressController.createAddress);

// Update an address
router.put('/:id', addressController.updateAddress);

// Delete an address
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
