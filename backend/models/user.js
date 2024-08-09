const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  
  activated: {
    type: Boolean,
    default: false
}, 
UserType: {
  type: String,
  required: true,
  enum: ['Admin', 'Client', 'Driver'],
},
phone: {
  type: Number,
  required: true,
  
},
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;



