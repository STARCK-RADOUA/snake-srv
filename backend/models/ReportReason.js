const mongoose = require('mongoose');

const reportReasonSchema = new mongoose.Schema({
  reason: { type: String, required: true },
  active: { type: Boolean, default: true } // Permet de désactiver un motif si nécessaire
}, {
  timestamps: true
});

const ReportReason = mongoose.model('ReportReason', reportReasonSchema);

module.exports = ReportReason;
