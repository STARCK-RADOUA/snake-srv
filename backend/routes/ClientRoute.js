const express = require("express");
const router = express.Router();
const driverAuth = require("./middlewares/driverAuth.js");

const {
    getClients,
    getClientById,
    saveClient,
    updateClient,
    deleteClient,
    getClientHistory
} = require('../controllers/ClientController.js')



router.get('/Clients', getClients);
router.get('/Clients/:id', getClientById);
router.post('/Clients', saveClient);
router.patch('/Clients/:id', updateClient);
router.delete('/Clients/:id', deleteClient);
router.get('/Clients/history/:id', driverAuth,getClientHistory);


module.exports = router