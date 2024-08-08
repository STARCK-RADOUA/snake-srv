const express = require("express");
const router = express.Router();

const  { 
    getAdminByUser_id,
    updateAdmin,
    getClientByUser_id,
    updateClient,
    getDriverByUser_id,
    updateDriver,
} = require('../controllers/ProfileController.js')
 
 
router.get('/profile/admin/:id', getAdminByUser_id);
router.patch('/profile/admin/:id', updateAdmin);

router.get('/profile/Client/:id', getClientByUser_id);
router.patch('/profile/Client/:id', updateClient);

router.get('/profile/Driver/:id', getDriverByUser_id);
router.patch('/profile/Driver/:id', updateDriver);


module.exports = router