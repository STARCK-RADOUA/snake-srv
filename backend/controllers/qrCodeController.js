// controllers/qrCodeController.js
const QrCode = require('../models/QrCode');
const { v4: uuidv4 } = require('uuid');
const Client = require('../models/Client');
const User = require('../models/User');
const Driver = require('../models/Driver');
// Générer un nouveau QR code
exports.generateQrCode = async (req, res) => {
  try {
    const { clientId, deviceId } = req.body;
    const uniqueId = uuidv4(); // Générer un ID unique
    const timestamp = Date.now();
    const expirationTime = timestamp + 15 * 60 * 1000; // Expire après 15 minutes
    const type = "Client"

    // Créer et sauvegarder le QR code dans MongoDB
    const qrCode = new QrCode({
      clientId,
      deviceId,
      uniqueId,
      type,
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
exports.generateQrCodeDriver = async (req, res) => {
  try {
    const { deviceId } = req.body;
    const uniqueId = uuidv4(); // Générer un ID unique
    const timestamp = Date.now();
    const expirationTime = timestamp + 15 * 60 * 1000; 
    console.log(deviceId,"22222222222222222222222")// Expire après 15 minutes
      const user = await User.findOne({ deviceId: deviceId });
      if(!user){
        return res.status(404).json({ error: 'User not found' });
      }
      const driver = await Driver.findOne({ user_id: user._id });
      if(!driver){
        return res.status(404).json({ error: 'Driver not found' });
      }



const clientId = driver._id

const type = "Driver"
    // Créer et sauvegarder le QR code dans MongoDB
    const qrCode = new QrCode({
      clientId,
      deviceId,
      type,
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
  

console.log("///////////////////////////////////////////////////////")
console.log(req.body)
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
   
    await qrCode.save();

   // Assuming pointsToAdd is the number of points you want to add


    // Notifier via Socket.IO que le QR code a été scanné
    req.io.emit('qrCodeScanned', { uniqueId, clientId: qrCode.clientId });

    // Répondre avec succès
    res.status(200).json({ message: 'QR code valide et traité' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la vérification du QR code' });
  }
};


// Controller to get QR codes where isUsed = true with user info
exports.getUsedQrCodesWithUserInfo = async (req, res) => {
  try {
    // Find all QR codes where isUsed is true
    const usedQrCodes = await QrCode.find({ isUsed: true });

    // Prepare an array to store the results
    const qrCodesWithUserInfo = [];

    for (const qrCode of usedQrCodes) {
      let userInfo = null;

      // Check if the clientId exists in the Client collection
      const client = await Client.findOne({ _id: qrCode.clientId }).populate('user_id');
      
      if (client) {
        // If client is found, get user info from the populated user_id field
        userInfo = {
          userType: 'Client',
          id: client._id,
          firstName: client.user_id.firstName,
          lastName: client.user_id.lastName,
          phone: client.user_id.phone,
        };
      } else {
        // If not found in Client, check in Driver collection
        const driver = await Driver.findOne({ _id: qrCode.clientId }).populate('user_id');
        if (driver) {
          userInfo = {
            userType: 'Driver',
            id: driver._id,
            firstName: driver.user_id.firstName,
            lastName: driver.user_id.lastName,
            phone: driver.user_id.phone,
          };
        }
      }

      // If userInfo is found, add it to the response array
      if (userInfo) {
        qrCodesWithUserInfo.push({
          id : qrCode._id ,
          qr: qrCode.uniqueId,
          clientId: qrCode.clientId,
          newclientDeviceId: qrCode.newclientDeviceId,
          type: qrCode.type,
          deviceId: qrCode.deviceId ,
          timestamp: qrCode.timestamp,
          expirationTime: qrCode.expirationTime,
          userInfo: userInfo,
        });
      }
    }

    // Return the results
    res.status(200).json(qrCodesWithUserInfo);

  } catch (error) {
    console.error('Error fetching QR codes:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

