const mongoose = require('mongoose');

const systemDownSchema = new mongoose.Schema({

  isSystem: { type: Boolean, required: true },
  MAX_TRANCHE: { type: String, default: "30" },
  actuTranche: { type: String, default: "10" },
 
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const systemDown = mongoose.model('systemDown', systemDownSchema);
module.exports = systemDown;
