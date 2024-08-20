// models/Warn.js

const mongoose = require('mongoose');

const WarnSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  deviceId: { type: String, required: true ,unique:true},
 
  phone: { type: Number, required: [true, 'Please provide phone'], unique:true  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
},  location: {
    type: String,
    required: [true, 'Please provide location'],
},

 

}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Warn = mongoose.model('Warn', WarnSchema);
module.exports = Warn;
