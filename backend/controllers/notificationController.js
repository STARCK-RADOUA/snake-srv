const Notification = require('../models/Notification');

exports.sendNotification = async (data, io) => {
  try {
    const { user_id, title, message } = data;

    // Créer une nouvelle notification
    const notification = new Notification({
      user_id,
      title,
      message,
    });

    await notification.save();

    // Émettre la notification en temps réel via Socket.IO
    io.emit('newNotification', notification);

    return notification;
  } catch (err) {
    console.error('Failed to send notification:', err);
    throw err;
  }
};

exports.getNotifications = async (user_id) => {
  try {
    const notifications = await Notification.find({ user_id: user_id }).sort({ created_at: -1 });
    return notifications;
  } catch (err) {
    console.error('Failed to get notifications:', err);
    throw err;
  }
};

exports.markAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read_at: new Date() },
      { new: true }
    );

    return notification;
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
    throw err;
  }
};
