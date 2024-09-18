const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  additional_driver_info: String,
  isDisponible: { type: Boolean, default: false },
  location: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    isConnected: { type: Boolean, default: false }
  },
  orders_count: { type: Number, default: 0 } // Ajouté pour suivre le nombre de commandes

});

const driver = mongoose.model('Driver', driverSchema);
module.exports = driver;
