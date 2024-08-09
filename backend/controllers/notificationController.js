const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all notifications
exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find().populate('user_id');
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// Get a notification by ID
exports.getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id).populate('user_id');
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notification' });
    }
};

// Create a new notification
exports.createNotification = async (req, res) => {
    try {
        const { user_id, message } = req.body;
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newNotification = new Notification({ user_id, message });
        await newNotification.save();
        res.status(201).json(newNotification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create notification' });
    }
};

// Update a notification
exports.updateNotification = async (req, res) => {
    try {
        const { message, read_at } = req.body;
        const notification = await Notification.findByIdAndUpdate(req.params.id, { message, read_at }, { new: true });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};
