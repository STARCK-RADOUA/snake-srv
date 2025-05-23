// routes/clientRoutes.js

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/ClientController');

// Route pour obtenir tous les clients
router.get('/', clientController.getClients);

// Route pour obtenir un client par ID
router.get('/:id', clientController.getClientById);

// Route pour créer un nouveau client
router.post('/', clientController.saveClient);

// Route pour mettre à jour un client existant
router.put('/:id', clientController.updateClient);

// Route pour supprimer un client
router.delete('/:id', clientController.deleteClient);

// Route pour obtenir l'historique d'un client
router.get('/:id/history', clientController.getClientHistory);

module.exports = router;
