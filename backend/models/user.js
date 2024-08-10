// models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
 
  phone: { type: Number, required: true },
 
  userType: { type: String, required: true, enum: ['Admin', 'Client', 'Driver'] },
  activated: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
