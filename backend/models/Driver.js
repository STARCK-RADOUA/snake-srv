const mongoose = require('mongoose');
const User = require('./User'); // This should remain here and is fine

const driverSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  additional_driver_info: String,
  isDisponible: { type: Boolean, default: false },

});

const driver = mongoose.model('Driver', driverSchema);
module.exports = driver;
