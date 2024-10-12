const express = require('express');
const { getProducts, addProductA, updateProduct, deleteProduct ,getProductRevenueAndCountBetweenDatesPDF  , getProductRevenueAndCountBetweenDates, getAllProductRevenueAndCountBetweenDates} = require('../controllers/ProductController');
const router = express.Router();

router.get('/get', getProducts);
router.post('/add', addProductA);
router.put('/update/:productId',updateProduct );
router.delete('/delete/:id', deleteProduct);
router.post('/revenue-between-dates', getProductRevenueAndCountBetweenDates);
router.get('/all-revenue-between-dates', getAllProductRevenueAndCountBetweenDates);

router.get('/:productId/products/pdf', getProductRevenueAndCountBetweenDatesPDF);



module.exports = router;
