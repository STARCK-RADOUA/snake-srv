const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // 'driver' or 'client'
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  seen: { type: Boolean, default: false }  // New field to track if the message has been seen
});

const chatSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },  // The order related to the chat
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },  // Driver participating in the chat
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },  // Client participating in the chat
  messages: [messageSchema],  // Array of messages
}, {
  timestamps: true
});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
