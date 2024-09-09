const User = require('../models/User');
const Notification = require('../models/Notification');
const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
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










// Fonction générique pour envoyer des notifications
exports.sendNotificationAdmin = async (username, targetScreen, messageBody, title) => {
  try {
    // Récupération de tous les administrateurs avec un PushToken
    const admins = await User.find({ userType: "Admin" }).select('pushToken');

    if (!admins || admins.length === 0) {
      console.error('No admins found with PushTokens');
      return;
    }

    console.log(admins);

    // Boucle sur chaque administrateur trouvé
    for (const admin of admins) {
      if (!admin.pushToken) {
        console.error(`Admin with ID ${admin._id} has no PushToken`);
        continue;
      }

      const message = {
        to: admin.pushToken,
        sound: 'default',
        title: title,
        body: `${username} ${messageBody}`,
        data: { targetScreen: targetScreen },
      };

      // Enregistrement de la notification dans la base de données
      const notification = new Notification({
        user_id: admin._id,
        title: title,
        message: message.body
      });
      await notification.save();

      // Envoi de la notification
      try {
        const response = await axios.post(EXPO_PUSH_URL, message);
        console.log(`Notification envoyée à l'admin ID ${admin._id}:`, response.data);
      } catch (error) {
        console.error(`Erreur lors de l'envoi de la notification à l'admin ID ${admin._id}:`, error.message);
      }
    }

    return 'Notifications envoyées à tous les administrateurs';
  } catch (error) {
    console.error('Erreur lors de la récupération des administrateurs ou de l\'envoi des notifications:', error.message);
  }
};


// Fonction générique pour envoyer des notifications
exports.sendNotificationForce = async (username, pushToken, messageBody, title,userType) => {
  try {
    // Récupérer les utilisateurs en fonction de leur type (Client ou Driver)
    const users = await User.find({ pushToken: pushToken }).select('pushToken');
console.log(users)
    if (!users || users.length === 0) {
      console.error('Aucun PushToken trouvé pour ce type d\'utilisateur');
      return;
    }

    // Envoyer une notification à chaque utilisateur sélectionné
    const notificationsPromises = users.map(async (user) => {
      if (!user.pushToken) return;

      const message = {
        to: user.pushToken,
        sound: 'default',
        title: title,
        body: `${messageBody}`,
        data: { targetScreen: "home" },
      };

      // Enregistrer la notification dans la base de données
      const notification = new Notification({
        user_id: user._id,
        title: title,
        message: message.body
      });
      await notification.save();

      // Envoyer la notification
      return axios.post(EXPO_PUSH_URL, message);
    });

    // Exécution des promesses pour envoyer les notifications
    await Promise.all(notificationsPromises);
    console.log('Notifications envoyées avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications:', error.message);
  }
};