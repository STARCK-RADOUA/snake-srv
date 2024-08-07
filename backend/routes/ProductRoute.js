const express = require("express");
const router = express.Router();
const driverAuth = require("./middlewares/driverAuth.js");
const userAuth = require("./middlewares/userAuth");

const {
    getProducts,
    saveProduct
} = require('../controllers/ProductController.js');



router.post('/Products', userAuth, getProducts);
router.post('/Product', driverAuth, saveProduct);

module.exports = router