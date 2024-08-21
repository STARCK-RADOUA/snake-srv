const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  image_url: String,
  service_type: { type: String, required: true },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  options: [optionSchema] // Liste des choix supplémentaires
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
