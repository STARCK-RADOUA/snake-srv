const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bcrypt = require("bcrypt");

const DriverSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  phone: {
    type: String
  },
  department: {
    type: String
  },
  address: {
    type: String
  } ,
  imageUrls: {
    type: Array,
    required: false,
  }
});

//hashing password
DriverSchema.pre('save', function (next) {
  const Driver = this

  bcrypt.hash(Driver.password, 10, (error, hash) => {
    Driver.password = hash
    next()
  })
})

const Driver = mongoose.model("Driver", DriverSchema);

module.exports = Driver;
