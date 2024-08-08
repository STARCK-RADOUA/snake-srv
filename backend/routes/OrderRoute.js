const express = require("express");
const router = express.Router();
const adminAuth = require('./middlewares/adminAuth');


const {
    getDepartments,
    getOrders,
    getOrderById,
    createOrderSlot,
    bookOrder,
    deleteOrder,
    updateOrderById
} = require('../controllers/OrderController.js');
const UserAuth = require("./middlewares/UserAuth");


//gets list of all departments
router.get('/departments', getDepartments);

//gets Order by id
router.get('/Orders/:id', getOrderById);

//get all Orders based on body params
router.post('/Orders', UserAuth, getOrders);

//create an empty slot 
router.post('/Orders/add', createOrderSlot);

//book an Order (basically update an empty slot )
router.put('/Orders/', bookOrder);

//update an Order by id
router.put('/Orders/:id', updateOrderById);

//delete Order by id
router.delete('/Orders/', deleteOrder);

module.exports = router