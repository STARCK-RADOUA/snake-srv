const OrderHistory = require('../models/OrderHistory');
const Order = require('../models/Order');

// Get all order histories
exports.getAllOrderHistories = async (req, res) => {
    try {
        const orderHistories = await OrderHistory.find().populate('order_id');
        res.status(200).json(orderHistories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order histories' });
    }
};

// Get an order history by ID
exports.getOrderHistoryById = async (req, res) => {
    try {
        const orderHistory = await OrderHistory.findById(req.params.id).populate('order_id');
        if (!orderHistory) {
            return res.status(404).json({ error: 'Order history not found' });
        }
        res.status(200).json(orderHistory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order history' });
    }
};

// Create a new order history
exports.createOrderHistory = async (req, res) => {
    try {
        const { order_id, status, updated_at } = req.body;
        const order = await Order.findById(order_id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const newOrderHistory = new OrderHistory({ order_id, status, updated_at });
        await newOrderHistory.save();
        res.status(201).json(newOrderHistory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create order history' });
    }
};

// Update an order history
exports.updateOrderHistory = async (req, res) => {
    try {
        const { status, updated_at } = req.body;
        const orderHistory = await OrderHistory.findByIdAndUpdate(req.params.id, { status, updated_at }, { new: true });

        if (!orderHistory) {
            return res.status(404).json({ error: 'Order history not found' });
        }

        res.status(200).json(orderHistory);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order history' });
    }
};

// Delete an order history
exports.deleteOrderHistory = async (req, res) => {
    try {
        const orderHistory = await OrderHistory.findByIdAndDelete(req.params.id);
        if (!orderHistory) {
            return res.status(404).json({ error: 'Order history not found' });
        }
        res.status(200).json({ message: 'Order history deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete order history' });
    }
};


