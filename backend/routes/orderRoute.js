const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Define the route for updating the payment and exchange of an order
router.put('/update/:orderId', orderController.updateOrderPayment);

router.post('/update/feedback', orderController.updateOrderFeedback);

router.patch('/:orderId/cancel', orderController.cancelOrder);

module.exports = router;
