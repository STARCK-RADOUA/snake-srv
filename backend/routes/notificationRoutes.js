
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Route pour obtenir toutes les notifications d'un utilisateur
router.get('/:user_id', async (req, res) => {
  try {
    const notifications = await notificationController.getNotifications(req.params.user_id);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
});

// Route pour ajouter une nouvelle notification
router.post('/', async (req, res) => {
  try {
    const notification = await notificationController.sendNotification(req.body, req.io);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error adding notification', error });
  }
});

// Route pour marquer une notification comme lue
router.put('/:id/read', async (req, res) => {
  try {
    const updatedNotification = await notificationController.markAsRead(req.params.id);
    res.status(200).json(updatedNotification);
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read', error });
  }
});

module.exports = router;
