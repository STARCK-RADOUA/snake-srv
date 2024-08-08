const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  
  activated: {
    type: Boolean,
    default: false
}, 
userType: {
  type: String,
  required: true,
  enum: ['Admin', 'Client', 'Driver'],
},
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
