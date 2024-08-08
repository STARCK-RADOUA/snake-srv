const mongoose = require('mongoose');
const User = require('./User'); // Assuming User model is in the same directory

const clientSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  additional_client_info: String,
 

});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
