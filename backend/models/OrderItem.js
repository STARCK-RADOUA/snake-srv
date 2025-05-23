const mongoose = require('mongoose');

const selectedOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const orderItemSchema = new mongoose.Schema({
  
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  cart_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  selected_options: [selectedOptionSchema],  // Liste des options supplémentaires choisies
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const OrderItem = mongoose.model('OrderItem', orderItemSchema);
module.exports = OrderItem;
