const jwt = require("jsonwebtoken");
const adminAuth = require("./adminAuth");
const driverAuth = require("./driverAuth");
const clientAuth = require("./clientAuth");
const Client = require('../../models/Client');
const mongoose = require("mongoose");
const Driver = require("../../models/Driver");


function UserAuth(req, res, next) {
    // console.log("adminAuth hit",);
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    jwt.verify(token, "ae2d8329d69cb40ef776f4d64c9b20ee67971cfd3df455f199d1f500712018fc", async (err, payload) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // console.log("adminAuth ",payload);
        req.sender = {
            "id": payload.id,
            "UserType": payload.UserType
        };
        if (payload.UserType == "Admin") {
             adminAuth(req,res,next);
        }
        else if (payload.UserType == "Driver") {
             driverAuth(req,res,next);
            let Driver = await Driver.findOne({
                'User_id': mongoose.Types.ObjectId(req.sender.id)
            })
            req.sender.DriverId = Driver._id;
        }
        else if (payload.UserType == "Client") {
            clientAuth(req,res,next);
            let Client = await Client.findOne({
                'User_id': mongoose.Types.ObjectId(req.sender.id)
            })
            // console.log("inside User auth. Client",req.sender.id)
            // console.log("inside User auth. Client",Client)
            req.sender.ClientId = Client._id;
        }
        else {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        next();
    });

}

module.exports = UserAuth;
