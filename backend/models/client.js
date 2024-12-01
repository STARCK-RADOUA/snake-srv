// models/Client.js

const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  additional_client_info: String,
  blocked: { type: Boolean, default: false },  // Blocked property added

}, {
  timestamps: true
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
//CLIENT ORDERV USER PRODUCT 