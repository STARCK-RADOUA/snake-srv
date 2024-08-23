// models/Service.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  test: { type: Boolean, required: true },
  isSystemPoint: { type: Boolean, required: true }

});

module.exports = mongoose.model('Service', serviceSchema);
