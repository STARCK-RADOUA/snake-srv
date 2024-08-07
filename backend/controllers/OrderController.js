const Order = require("../models/Order.js");
const Driver = require("../models/Driver.js");
const Client = require("../models/Client.js");
const mongoose = require("mongoose");


const getDepartments = async (req, res) => {
    try {
        let departmentList = await Driver.distinct("department");
        res.json({ message: "success", 'departments': departmentList });
    }
    catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
}

const getOrders = async (req, res) => {
    try {
        // console.log("appDate",req.body.appDate)
        let isTimeSlotAvailable = req.body.isTimeSlotAvailable;
        let OrderType = req.body.OrderType;
        let OrderDate = req.body.appDate?(new Date(req.body.appDate).toISOString().slice(0, 10)):null;
        let docID = req.body.DriverID;
        let Orders = [];
        if (isTimeSlotAvailable) {
            if (docID) {
                Orders = await Order.find({
                    'isTimeSlotAvailable': isTimeSlotAvailable,
                    'OrderDate': OrderDate,
                    "OrderType": OrderType,
                    'DriverId': mongoose.Types.ObjectId(docID)
                });
            }
            else if (req.sender.userType == "Driver") {
                Orders = await Order.find({
                    'isTimeSlotAvailable': isTimeSlotAvailable,
                    'OrderDate': OrderDate,
                    "OrderType": OrderType,

                    'DriverId': req.sender.DriverId
                }).populate({
                    path: 'DriverId',
                    populate: {
                        path: 'userId'
                    }
                })
                    .populate({
                        path: 'ClientId',
                        populate: {
                            path: 'userId'
                        }
                    });
            }
        } else if (isTimeSlotAvailable == false) {
            // console.log("here 2")
            if (req.sender.userType == "Admin") {
                Orders = await Order.find({
                    'isTimeSlotAvailable': false,
                    'completed': false,
                    
                    'OrderDate': OrderDate,
                   
                    
                }).populate({
                    path: 'DriverId',
                    populate: {
                        path: 'userId'
                    }
                })
                    .populate({
                        path: 'ClientId',
                        populate: {
                            path: 'userId'
                        }
                    });
            }
            else if (req.sender.userType == "Client") {
                console.log("ClientId" , req.sender.ClientId);
                let query = {
                    'isTimeSlotAvailable': false,
                    "OrderType": OrderType,
                    'completed': false,
                    'ClientId': req.sender.ClientId
                }
                if (docID){
                    query.DriverId = mongoose.Types.ObjectId(docID)
                }
                if (OrderDate) {
                    query.OrderDate = OrderDate
                }
                Orders = await Order.find(query).populate({
                    path: 'DriverId',
                    populate: {
                        path: 'userId'
                    }
                })
                    .populate({
                        path: 'ClientId',
                        populate: {
                            path: 'userId'
                        }
                    });
            }
            else if (req.sender.userType == "Driver") {
                Orders = await Order.find({
                    'isTimeSlotAvailable': false,
                    'completed': false,
                    
                    'OrderDate': OrderDate,
                   
                    'DriverId': req.sender.DriverId
                }).populate({
                    path: 'DriverId',
                    populate: {
                        path: 'userId'
                    }
                })
                    .populate({
                        path: 'ClientId',
                        populate: {
                            path: 'userId'
                        }
                    });
            }
           
             console.log(Orders)
        }
        console.log("OrderDate",OrderDate);
        console.log("OrderType", OrderType);
         console.log("docID",docID);
         console.log("isTimeSlotAvailable",isTimeSlotAvailable);
         console.log("Orders",Orders);
        res.json({ message: "success", 'Orders': Orders });
    } catch (error) {
        res.status(500).json({ errors: [error.message] });
    }
}

const createOrderSlot = async (req, res) => {
    try {
        let appDate = (new Date(req.body.appDate).toISOString().slice(0, 10));
        let timeSlots = req.body.timeSlots;
        let OrderType = req.body.OrderType;
        let docID = req.body.DriverID;
        // console.log(slot)
        for (slot of timeSlots) {
            let app = await Order.find({
                'OrderDate': appDate,
                'OrderTime': slot,
                "OrderType": OrderType,
                'DriverId': docID
            });
            if (!(app.length > 0)) {
                let Order = await Order.create({
                    'OrderDate': appDate,
                    'OrderTime': slot,
                    "OrderType": OrderType,
                    'DriverId': docID
                });
            }
        }
        // console.log(appDate)
        res.json({ message: "success" });


    } catch (error) {
        res.status(404).json({ errors: [error.message] });
    }
}

const bookOrder = async (req, res) => {
    try {
        let Order = await Order.findOneAndUpdate({
            'isTimeSlotAvailable': true,
            'OrderDate': req.body.appDate,
            'OrderTime': req.body.appTime,
            "OrderType": req.body.OrderType,
            'DriverId': mongoose.Types.ObjectId(req.body.DriverId)
        }, {
            'isTimeSlotAvailable': false,
            'ClientId': mongoose.Types.ObjectId(req.body.ClientId)
        });
        // console.log("Order",Order);
        if (Order) {
            res.json({ message: "success" });
        }
        else {
            res.status(404).json({ errors: ["Could not book Order. Please Try again."] });
        }
    } catch (error) {
        res.status(404).json({ errors: [error.message] });
    }
}

const deleteOrder = async (req, res) => {
    // console.log("delete Order")
    try {
        let Order = await Order.findByIdAndDelete(req.body.OrderId);
        if (Order) {
            res.json({ message: "success" });
        }
        else {
            res.status(404).json({ errors: ["Could not delete Order"] });
        }
    } catch (error) {
        res.status(404).json({ errors: [error.message] });
    }
}
const getOrderById = async (req, res) => {
    try {
        const Order = await Order.findById(req.params.id).lean();
        Order.DriverDetails = await Driver.findById(Order.DriverId);
        Order.ClientDetails = await Client.findById(Order.ClientId);
        res.json({ message: "success", "Order": Order });
    } catch (error) {
        res.status(404).json({ errors: [error.message] });
    }
}

const updateOrderById = async (req, res) => {
    try {
        const Order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                'isTimeSlotAvailable': false,
                'OrderDate': req.body.appDate,
                'OrderTime': req.body.appTime,
                'OrderType': req.body.OrderType,
                'DriverId': mongoose.Types.ObjectId(req.body.DriverId),
                'ClientId': mongoose.Types.ObjectId(req.body.ClientId)
            });
        if (Order) {
            const openSlot = await Order.findOneAndDelete({
                'isTimeSlotAvailable': true,
                'OrderDate': req.body.appDate,
                'OrderTime': req.body.appTime,
                'OrderType': req.body.OrderType,
            })
            res.json({ message: "success" });
        }

    } catch (error) {
        res.status(404).json({ errors: [error.message] });
    }
}


module.exports = {
    getDepartments,
    getOrders,
    getOrderById,
    createOrderSlot,
    bookOrder,
    deleteOrder,
    updateOrderById
}