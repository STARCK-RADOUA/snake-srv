const express = require('express');
const { getProducts, addProductA, updateProduct, deleteProduct } = require('../controllers/ProductController');
const router = express.Router();

router.get('/get', getProducts);
router.post('/add', addProductA);
router.put('/update/:productId',updateProduct );
router.delete('/delete/:id', deleteProduct);



module.exports = router;
