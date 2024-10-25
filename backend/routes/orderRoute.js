const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Define the route for updating the payment and exchange of an order
router.put('/update/:orderId', orderController.updateOrderPayment);

router.post('/update/feedback', orderController.updateOrderFeedback);
router.get('/all', orderController.getOrderHistory);
router.get('/:driverId/orders/pdf', orderController.fetchOrdersAndGeneratePDF);
router.get('/allbytime', orderController.getAllDriverStatsBytime);

router.patch('/:orderId/cancel', orderController.cancelOrder);
router.post('/update-driver-id', orderController.updateDriverId);
router.put('/affect-order', orderController.affectOrderToDriver);

router.get('/order-status-counts', orderController.getOrderStatusCounts);


module.exports = router;
