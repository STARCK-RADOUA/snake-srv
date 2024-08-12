const mongoose = require('mongoose');
const User = require('./User'); // Assuming User model is in the same directory

const driverSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  additional_driver_info: String
});

const driver = mongoose.model('driver', driverSchema);
module.exports = driver;
