const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bcrypt = require("bcrypt");

const ClientSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  phone: {
    type: String
  },
  address: {
    type: String
  },
  gender: {
    type: String
  },
  dob: {
    type: String
  }
});

//hashing password
ClientSchema.pre('save', function (next) {
  const Client = this

  bcrypt.hash(Client.password, 10, (error, hash) => {
    Client.password = hash
    next()
  })
})


const Client = mongoose.model("Client", ClientSchema);

module.exports = Client;
