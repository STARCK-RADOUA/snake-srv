const express = require("express");
const router = express.Router();
const driverAuth = require("./middlewares/driverAuth.js");
const UserAuth = require("./middlewares/UserAuth");

const {
    getProducts,
    saveProduct
} = require('../controllers/ProductController.js');



router.post('/Products', UserAuth, getProducts);
router.post('/Product', driverAuth, saveProduct);

module.exports = router