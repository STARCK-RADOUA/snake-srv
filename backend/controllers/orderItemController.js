const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Get all order items
exports.getAllOrderItems = async (req, res) => {
    try {
        const orderItems = await OrderItem.find().populate('order_id').populate('product_id');
        res.status(200).json(orderItems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order items' });
    }
};

// Get an order item by ID
exports.getOrderItemById = async (req, res) => {
    try {
        const orderItem = await OrderItem.findById(req.params.id).populate('order_id').populate('product_id');
        if (!orderItem) {
            return res.status(404).json({ error: 'Order item not found' });
        }
        res.status(200).json(orderItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order item' });
    }
};

// Create a new order item
exports.createOrderItem = async (req, res) => {
    try {
        const { order_id, product_id, quantity, price } = req.body;
        const order = await Order.findById(order_id);
        const product = await Product.findById(product_id);

        if (!order || !product) {
            return res.status(404).json({ error: 'Order or Product not found' });
        }

        const newOrderItem = new OrderItem({ order_id, product_id, quantity, price });
        await newOrderItem.save();
        res.status(201).json(newOrderItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create order item' });
    }
};

// Update an order item
exports.updateOrderItem = async (req, res) => {
    try {
        const { quantity, price } = req.body;
        const orderItem = await OrderItem.findByIdAndUpdate(req.params.id, { quantity, price }, { new: true });

        if (!orderItem) {
            return res.status(404).json({ error: 'Order item not found' });
        }

        res.status(200).json(orderItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order item' });
    }
};

// Delete an order item
exports.deleteOrderItem = async (req, res) => {
    try {
        const orderItem = await OrderItem.findByIdAndDelete(req.params.id);
        if (!orderItem) {
            return res.status(404).json({ error: 'Order item not found' });
        }
        res.status(200).json({ message: 'Order item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete order item' });
    }
};
