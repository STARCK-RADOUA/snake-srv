const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  device_id: { type: String, required: true },
  token: { type: String, required: true },
  expires_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;
