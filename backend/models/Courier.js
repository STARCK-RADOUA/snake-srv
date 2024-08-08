const mongoose = require('mongoose');
const User = require('./User'); // Assuming User model is in the same directory

const courierSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle_type: String,
  additional_courier_info: String
});

const Courier = mongoose.model('Courier', courierSchema);
module.exports = Courier;
