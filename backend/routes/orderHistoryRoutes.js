const express = require('express');
const router = express.Router();
const orderHistoryController = require('../controllers/orderHistoryController');

// Get all order histories
router.get('/', orderHistoryController.getAllOrderHistories);

// Get an order history by ID
router.get('/:id', orderHistoryController.getOrderHistoryById);

// Create a new order history
router.post('/', orderHistoryController.createOrderHistory);

// Update an order history
router.put('/:id', orderHistoryController.updateOrderHistory);

// Delete an order history
router.delete('/:id', orderHistoryController.deleteOrderHistory);

module.exports = router;
