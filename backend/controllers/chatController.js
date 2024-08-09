const Chat = require('../models/Chat');
const User = require('../models/User');
const Order = require('../models/Order');

// Get all chats
exports.getAllChats = async (req, res) => {
    try {
        const chats = await Chat.find().populate('sender_id').populate('receiver_id').populate('order_id');
        res.status(200).json(chats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
};

// Get a chat by ID
exports.getChatById = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id).populate('sender_id').populate('receiver_id').populate('order_id');
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
};

// Create a new chat
exports.createChat = async (req, res) => {
    try {
        const { order_id, sender_id, receiver_id, message } = req.body;
        const order = await Order.findById(order_id);
        const sender = await User.findById(sender_id);
        const receiver = await User.findById(receiver_id);

        if (!order || !sender || !receiver) {
            return res.status(404).json({ error: 'Order or User not found' });
        }

        const newChat = new Chat({ order_id, sender_id, receiver_id, message });
        await newChat.save();
        res.status(201).json(newChat);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create chat' });
    }
};

// Update a chat
exports.updateChat = async (req, res) => {
    try {
        const { message } = req.body;
        const chat = await Chat.findByIdAndUpdate(req.params.id, { message }, { new: true });

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update chat' });
    }
};

// Delete a chat
exports.deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findByIdAndDelete(req.params.id);
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.status(200).json({ message: 'Chat deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete chat' });
    }
};
