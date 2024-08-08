const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  status: { type: String, enum: ['created', 'approved', 'in_progress', 'delivered', 'cancelled'], required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: null }
});

const OrderHistory = mongoose.model('OrderHistory', orderHistorySchema);
module.exports = OrderHistory;
