const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address_line: { type: String, required: true },
  building: String,
  localisation: String,
  floor: String,
  door_number: String,
  digicode: String,
  comment: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
