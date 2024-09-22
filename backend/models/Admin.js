const mongoose = require('mongoose');
const User = require('./User'); // Assuming User model is in the same directory

const adminSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  additional_admin_info: String,
  isSystem: { type: Boolean, required: true },
  MAX_TRANCHE: { type: String, default: "30" },
  actuTranche: { type: String, default: "10" },
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
