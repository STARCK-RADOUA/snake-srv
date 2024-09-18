const express = require('express');
const { getProducts, addProductA, updateProduct, deleteProduct  , getProductRevenueAndCountBetweenDates} = require('../controllers/ProductController');
const router = express.Router();

router.get('/get', getProducts);
router.post('/add', addProductA);
router.put('/update/:productId',updateProduct );
router.delete('/delete/:id', deleteProduct);
router.post('/revenue-between-dates', getProductRevenueAndCountBetweenDates);



module.exports = router;
