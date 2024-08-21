// models/Client.js

const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  additional_client_info: String,
}, {
  timestamps: true
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
//CLIENT ORDERV USER PRODUCT 