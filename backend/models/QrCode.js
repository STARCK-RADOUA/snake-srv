// models/QrCode.js
const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  newclientId: { type: String, required: false },
  deviceId: { type: String, required: true },
  uniqueId: { type: String, required: true, unique: true },
  timestamp: { type: Date, required: true },
  expirationTime: { type: Date, required: true },
  isUsed: { type: Boolean, default: false }
});

module.exports = mongoose.model('QrCode', qrCodeSchema);
