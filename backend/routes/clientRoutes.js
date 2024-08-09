const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Get all clients
router.get('/', clientController.getAllClients);

// Get a client by ID
router.get('/:id', clientController.getClientById);

// Create a new client
router.post('/', clientController.createClient);

// Update a client
router.put('/:id', clientController.updateClient);

// Delete a client
router.delete('/:id', clientController.deleteClient);

module.exports = router;
