// models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  deviceId: { type: String, required: true ,unique:true},
 
  phone: { type: Number, required: [true, 'Please provide phone'], unique:true  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
},
points_earned: { type: Number, default: 0 },
 
  userType: { type: String, required: true, enum: ['Admin', 'Client', 'Driver'] },
  activated: { type: Boolean, default: false },
  email: { type: String, required: false , },
  isLogin: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
