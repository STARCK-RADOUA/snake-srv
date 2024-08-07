const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const bcrypt = require('bcrypt')

var uniqueValidator = require('mongoose-unique-validator')

const OrderSchema = new Schema({

  OrderDate: {
    type: Date,
    required: [true, 'Please provide Order date']
  },
  OrderTime: {
    type: String,
    required: [true, 'Please provide Order time']
  },
  OrderType: {
    type: String,
    required: [true, 'Please provide Order type']
  },
  isTimeSlotAvailable: {
    type: Boolean,
    default: true
  },
  ClientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client"
  },
  DriverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver"
  },
  completed: {
    type: Boolean,
    default: 0
  }
},
  {
    timestamps: true
  });


const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;