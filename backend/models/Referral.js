const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points_earned: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Referral = mongoose.model('Referral', referralSchema);
module.exports = Referral;
