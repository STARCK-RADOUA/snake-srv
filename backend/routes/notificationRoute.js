const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Route pour enregistrer le token push
router.post('/save-push-token', async (req, res) => {
  const { userType, pushToken,deviceId } = req.body;

  if (!userType || !pushToken || !deviceId) {
    return res.status(400).json({ error: 'userType and pushToken are required' });
  }

  try {
    // Mise à jour du pushToken de l'utilisateur en fonction du userType
    const user = await User.findOneAndUpdate(
      { deviceId: deviceId },
      { pushToken: pushToken },
      { new: true, upsert: true } // Crée un nouvel enregistrement si l'utilisateur n'existe pas
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Push token saved successfully', user });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du pushToken:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
