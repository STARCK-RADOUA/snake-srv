const express = require("express");
const router = express.Router();

const {
    getInvoice
} = require('../controllers/InvoiceController.js');




router.get('/Product/invoice/:id', getInvoice);

module.exports = router