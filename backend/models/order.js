const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'driver', required: false },
  address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: false },
  status: { type: String, enum: ['pending', 'in_progress', 'delivered', 'cancelled'], required: true },
  active: { type: Boolean, default: false },
  total_price: { type: Number, required: true },
  exchange: { type: Number, required: false },
  payment_method: { type: String, enum: ['cash', 'TPE'], required: false },
  comment: String,
  starts: Number,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;

