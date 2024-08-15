// models/ChatSupport.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // 'admin' or 'client'
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSupportSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  messages: [messageSchema] // Define messages as an array of messageSchema
}, {
  timestamps: true
});

const ChatSupport = mongoose.model('ChatSupport', chatSupportSchema);
module.exports = ChatSupport;
