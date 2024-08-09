const Order = require('../models/Order');
const Client = require('../models/Client');
const Courier = require('../models/Driver');
const Address = require('../models/Address');

// Get all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('client_id').populate('courier_id').populate('address_id');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

// Get an order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('client_id').populate('courier_id').populate('address_id');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

// Create a new order
exports.createOrder = async (req, res) => {
    try {
        const { client_id, courier_id, address_id, status, total_price, payment_method } = req.body;
        const client = await Client.findById(client_id);
        const courier = courier_id ? await Courier.findById(courier_id) : null;
        const address = await Address.findById(address_id);

        if (!client || !address || (courier_id && !courier)) {
            return res.status(404).json({ error: 'Client, Courier or Address not found' });
        }

        const newOrder = new Order({ client_id, courier_id, address_id, status, total_price, payment_method });
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create order' });
    }
};

// Update an order
exports.updateOrder = async (req, res) => {
    try {
        const { status, courier_id } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status, courier_id }, { new: true });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order' });
    }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete order' });
    }
};
