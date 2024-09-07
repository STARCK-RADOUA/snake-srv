const mongoose = require('mongoose');

const systemDownSchema = new mongoose.Schema({

  dijanteur: { type: Boolean, required: true },
 
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const systemDown = mongoose.model('systemDown', systemDownSchema);
module.exports = systemDown;
