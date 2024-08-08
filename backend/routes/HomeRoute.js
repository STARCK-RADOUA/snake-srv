const express = require("express");
const router = express.Router();
const UserAuth = require('./middlewares/UserAuth');
const driverAuth = require('./middlewares/driverAuth');


const {
    getUserCountByRole,
    getOrderCount,
    getClientsTreatedCount
} = require('../controllers/AdminDashController.js')



router.post('/count/Users', UserAuth, getUserCountByRole);
router.get('/count/Orders', UserAuth, getOrderCount);
router.get('/count/Clients/treated', driverAuth, getClientsTreatedCount)


module.exports = router