const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // 'driver' or 'client'
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true }, // Corrected reference
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  messages: [messageSchema], // Array of messages between the driver and client
}, {
  timestamps: true
});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
