// routes/historiqueRoutes.js
const express = require('express');
const router = express.Router();
const {getHistoriqueByUserId} = require('../controllers/historiqueUtils')    

// Route pour récupérer l'historique d'un utilisateur
router.get('/:userId', getHistoriqueByUserId);

module.exports = router;
