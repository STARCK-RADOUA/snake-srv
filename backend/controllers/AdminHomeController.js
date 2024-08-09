const User = require("../models/User.js");
const Order = require("../models/Order.js");
const Product = require("../models/Product.js");
const mongoose = require("mongoose");

var moment = require('moment'); 

const getUserCountByRole = async (req, res) => {
     console.log("api hit")
    try {
        var userType = req.body.userType;
        console.log(req.body);
        let users = [];
        if (userType) {
            users = await User.find({ "userType": userType });
            res.json({ 'count': users.length });
        }
        else {
            res.status(400).json({ errors: ["User type is missing in body"] })
        }

    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
}

const getOrderCount = async (req, res) => {
    try {
        let query = {
            "OrderDate": moment(new Date()).format('YYYY-MM-DD'),
            'isTimeSlotAvailable': false,
        }
        if(req.sender.DriverId){
            query.DriverId = req.sender.DriverId
        }
        if(req.sender.ClientId){
            query.ClientId = req.sender.ClientId
        }
        let OrdersToday = await Order.find(query);

        let pendingOrdersToday = await Order.find({
            ...query,
            "completed": false
        })
        // console.log(new Date().toLocaleDateString('zh-Hans-CN'));
        // console.log(OrdersToday.length);
        res.json({
            "message": "success",
            'totalOrders': OrdersToday.length,
            "pendingOrders": pendingOrdersToday.length,
        });

    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
}

const getClientsTreatedCount = async (req, res) => {
    try {
        if (!req.sender || !req.sender.DriverId) {
            return res.status(400).json({ errors: ["Driver ID is missing"] });
        }

        const DriverId = mongoose.Types.ObjectId(req.sender.DriverId);

        let Products = await Product.find({})
            .populate({
                path: 'OrderId',
                populate: {
                    path: 'DriverId',
                    match: { _id: DriverId }
                }
            });

        Products = Products.filter(pre => pre.OrderId && pre.OrderId.DriverId);

        res.json({
            "message": "success",
            'treatedClients': Products.length
        });

    } catch (error) {
        console.error('Error fetching treated Clients count:', error);
        res.status(500).json({ errors: [error.message] });
    }
};
 //5558
module.exports = {
    getUserCountByRole,
    getOrderCount,
    getClientsTreatedCount
}