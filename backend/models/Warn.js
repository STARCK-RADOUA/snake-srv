// models/Warn.js

const mongoose = require('mongoose');

const WarnSchema = new mongoose.Schema({
  firstName: { type: String, required: true, unique: false },
  lastName: { type: String, required: true, unique: false },
  deviceId: { type: String, unique: false },

  phone: { type: Number, required: [true, 'Please provide phone'], unique: false },
  password: {
    type: String, unique: false,
    required: [true, 'Please provide password'],
  }, 
  location: {
    type: String,
    required: [true, 'Please provide location'],
  },
  seen: { type: Boolean, default: false } ,  // New field to track if the message has been seen
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Warn = mongoose.model('Warn', WarnSchema);
module.exports = Warn;