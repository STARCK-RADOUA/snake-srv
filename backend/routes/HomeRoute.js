const express = require("express");
const router = express.Router();
const userAuth = require('./middlewares/userAuth');
const driverAuth = require('./middlewares/driverAuth');


const {
    getUserCountByRole,
    getOrderCount,
    getClientsTreatedCount
} = require('../controllers/AdminDashController.js')



router.post('/count/users', userAuth, getUserCountByRole);
router.get('/count/Orders', userAuth, getOrderCount);
router.get('/count/Clients/treated', driverAuth, getClientsTreatedCount)


module.exports = router