const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({

  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: false },
  address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: false },
  service_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: false },
  status: { type: String, enum: ['pending', 'in_progress', 'delivered', 'cancelled','test'], required: true },
  active: { type: Boolean, default: true },
  spam: { type: Boolean, default: false },
  notification_2min: { type: Boolean, default: false },
  notification_pret: { type: Boolean, default: false },
  total_price: { type: Number, required: true },
  exchange: { type: Number, required: false },
  report_reason: { type: String, required: false }, // Motif de signalement dynamique sélectionné
  report_comment: { type: String, required: false },
  payment_method: { type: String, enum: ['cash', 'TPE'], required: false },
  comment: String,
  drivercomment: String,
  service_Test: { type: Boolean, default: false },
  stars: Number,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

