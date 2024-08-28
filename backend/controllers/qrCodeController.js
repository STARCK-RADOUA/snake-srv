// controllers/qrCodeController.js
const QrCode = require('../models/QrCode');
const { v4: uuidv4 } = require('uuid');
const Client = require('../models/Client');
const User = require('../models/User');
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
    const uniqueId  = req.body.uniqueId;
    const  newclientIdobj  = req.body.newclientId;

console.log("///////////////////////////////////////////////////////")
console.log(req.body)
console.log(newclientIdobj)
console.log(uniqueId)
console.log("//////////////////////laaalaaaaalaaa/////////////////////////////////")
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
    qrCode.newclientId = newclientIdobj;
    await qrCode.save();

   // Assuming pointsToAdd is the number of points you want to add
const client = await Client.findOne({ _id: qrCode.clientId });

if (client) {
  await User.findOneAndUpdate(
    { _id: client.user_id }, // Find the user by their user_id (from Client)
    { $inc: { points_earned: 1 } }, // Increment points_earned by pointsToAdd
   
  );
} else {
  console.log('Client not found');
}

    // Notifier via Socket.IO que le QR code a été scanné
    req.io.emit('qrCodeScanned', { uniqueId, clientId: qrCode.clientId });

    // Répondre avec succès
    res.status(200).json({ message: 'QR code valide et traité' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la vérification du QR code' });
  }
};
