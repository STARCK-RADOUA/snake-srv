// controllers/qrCodeController.js
const QrCode = require('../models/QrCode');
const { v4: uuidv4 } = require('uuid');

// Générer un nouveau QR code
exports.generateQrCode = async (req, res) => {
  try {
    const { clientId, deviceId } = req.body;
    const uniqueId = uuidv4(); // Générer un ID unique
    const timestamp = Date.now();
    const expirationTime = timestamp + 15 * 60 * 1000; // Expire après 15 minutes

    // Créer et sauvegarder le QR code dans MongoDB
    const qrCode = new QrCode({
      clientId,
      deviceId,
      uniqueId,
      timestamp,
      expirationTime,
      isUsed: false,
    });
    await qrCode.save();

    // Répondre avec les données du QR code
    res.status(201).json({ uniqueId, timestamp, expirationTime });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la génération du QR code' });
  }
};

// Vérifier un QR code scanné
exports.verifyQrCode = async (req, res) => {
  try {
    const { uniqueId } = req.body;

    // Rechercher le QR code dans la base de données
    const qrCode = await QrCode.findOne({ uniqueId });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code non trouvé' });
    }

    // Vérifier si le QR code est expiré
    if (Date.now() > qrCode.expirationTime) {
      return res.status(400).json({ error: 'QR code expiré' });
    }

    // Vérifier si le QR code a déjà été utilisé
    if (qrCode.isUsed) {
      return res.status(400).json({ error: 'QR code déjà utilisé' });
    }

    // Marquer le QR code comme utilisé
    qrCode.isUsed = true;
    await qrCode.save();

    // Notifier via Socket.IO que le QR code a été scanné
    req.io.emit('qrCodeScanned', { uniqueId, clientId: qrCode.clientId });

    // Répondre avec succès
    res.status(200).json({ message: 'QR code valide et traité' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la vérification du QR code' });
  }
};
