const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getNotifications = async (deviceId) => {
  const user = await User.findOne({ deviceId });
  
  if (!user) {
    throw new Error(`No user found with deviceId: ${deviceId}`);
  }

  return await Notification.find({ user_id: user._id }).sort({ created_at: -1 });
};

exports.sendNotification = async (data, io) => {
  const notification = new Notification(data);
  await notification.save();
  io.emit('newNotification', notification);
  return notification;
};



exports.markAsRead = async (notificationId) => {
  const notification = await Notification.findById(notificationId);
  if (notification) {
    notification.read_at = new Date();
    await notification.save();
  }
  return notification;
};
