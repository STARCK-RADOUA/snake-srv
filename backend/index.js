const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();
const DepartementRoute = require("./routes/DepartementRoute");
const nodemailer = require("nodemailer");

const getAllClients = require("./routes/api/getAllClients");
const getClientByID = require("./routes/api/getClientByID");
const createClient = require("./routes/api/createClient");
const editClientByID = require("./routes/api/editClientByID");
const deleteClientByID = require("./routes/api/deleteClientByID");
const LoginRegisterRoute = require("./routes/LoginRegisterRoute.js");
const UserRoute = require("./routes/UserRoute.js");
const HomeRoute = require("./routes/HomeRoute.js");
const ClientRoute = require("./routes/ClientRoute.js");
const DriverRoute = require("./routes/DriverRoute.js");
const OrderRoute = require("./routes/OrderRoute.js");
const MedicineRoute = require("./routes/MedicineRoute.js");
const ProductRoute = require("./routes/ProductRoute.js");
const InvoiceRoute = require("./routes/InvoiceRoute.js");
const ProfileRoute = require("./routes/ProfileRoute.js");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.set("strictQuery", true);
mongoose.connect(
  "mongodb+srv://saadi0mehdi:1cmu7lEhWPTW1vGk@cluster0.whkh7vj.mongodb.net/myBase?retryWrites=true&w=majority&appName=Cluster0",
  { useNewUrlParser: true }
);

app.listen(3001, () => {
  console.log("App listening on port " + 3001);
});

app.use(LoginRegisterRoute);
app.use(HomeRoute);
app.use(UserRoute);
app.use(ClientRoute);
app.use(DriverRoute);
app.use(OrderRoute);
app.use(MedicineRoute);
app.use(ProductRoute);
app.use(InvoiceRoute);
app.use(ProfileRoute);
app.use(DepartementRoute);

app.get("/", (req, res) => {
  res.send("hello world");
});
