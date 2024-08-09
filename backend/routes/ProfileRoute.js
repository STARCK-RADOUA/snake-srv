const express = require("express");
const router = express.Router();

const  { 
    getAdminByuser_id,
    updateAdmin,
    getClientByuser_id,
    updateClient,
    getDriverByuser_id,
    updateDriver,
} = require('../controllers/ProfileController.js')
 
 
router.get('/profile/admin/:id', getAdminByuser_id);
router.patch('/profile/admin/:id', updateAdmin);

router.get('/profile/Client/:id', getClientByuser_id);
router.patch('/profile/Client/:id', updateClient);

router.get('/profile/Driver/:id', getDriverByuser_id);
router.patch('/profile/Driver/:id', updateDriver);


module.exports = router