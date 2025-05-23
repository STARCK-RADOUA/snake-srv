const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  OrderItem_id: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem', required: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'driver', required: false },
  address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  status: { type: String, enum: ['pending', 'approved', 'in_progress', 'delivered', 'cancelled'], required: true },
  total_price: { type: Number, required: true },
  payment_method: { type: String, enum: ['cash', 'TPE'], required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
