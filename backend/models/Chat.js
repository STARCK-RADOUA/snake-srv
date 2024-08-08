const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
