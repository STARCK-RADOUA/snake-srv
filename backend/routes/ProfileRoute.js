const express = require("express");
const router = express.Router();

const  { 
    getAdminByUserId,
    updateAdmin,
    getClientByUserId,
    updateClient,
    getDriverByUserId,
    updateDriver,
} = require('../controllers/ProfileController.js')
 
 
router.get('/profile/admin/:id', getAdminByUserId);
router.patch('/profile/admin/:id', updateAdmin);

router.get('/profile/Client/:id', getClientByUserId);
router.patch('/profile/Client/:id', updateClient);

router.get('/profile/Driver/:id', getDriverByUserId);
router.patch('/profile/Driver/:id', updateDriver);


module.exports = router