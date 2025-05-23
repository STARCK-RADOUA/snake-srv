const User = require("../models/User.js");
const Client = require("../models/Client.js");
const Driver = require("../models/Driver.js");

const getAdminByuser_id = async (req, res) => {
    //console.log(req.params.id);
    try {
        const admin = await User.findOne({_id : req.params.id});
        res.json(admin);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

const isAdminValid = (newUser) => {
    let errorList = [];
    if (!newUser.firstName) {
        errorList[errorList.length] = "Please enter first name";
    }
    if (!newUser.lastName) {
        errorList[errorList.length] = "Please enter last name";
    }
    if (!newUser.phone) {
        errorList[errorList.length] = "Please enter phone";
    }
    if (!newUser.password) {
        errorList[errorList.length] = "Please enter password";
    }
    if (!newUser.confirmPassword) {
        errorList[errorList.length] = "Please re-enter password in Confirm Password field";
    }
    
    if (!(newUser.password == newUser.confirmPassword)) {
        errorList[errorList.length] = "Password and Confirm Password did not match";
    }

    if (errorList.length > 0) {
        result = {
            status: false,
            errors: errorList
        }
        return result;
    }
    else {
        return { status: true };
    }

}

const updateAdmin = async (req, res) => {
    console.log(req.body);
    let newUser = req.body;
    let userValidStatus = isAdminValid(newUser);
    if (!userValidStatus.status) {
        res.status(400).json({
            message: 'error',
            errors: userValidStatus.errors
        });
    }
    else {
        try {
            const updateduser = await User.updateOne({ _id: req.params.id }, { $set: req.body });
            res.status(201).json({ message: 'success' });
        } catch (error) {
            res.status(400).json({ message: 'error', errors: [error.message] });
        }
    }
}


const getDriverByuser_id = async (req, res) => {
    //console.log(req.params.id);
    try {
        const Driver = await Driver.findOne({user_id : req.params.id}).populate('user_id');
        res.json(Driver);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}


const isDriverValid = (newDriver) => {
    let errorList = [];
    if (!newDriver.firstName) {
        errorList[errorList.length] = "Please enter first name";
    }
    if (!newDriver.lastName) {
        errorList[errorList.length] = "Please enter last name";
    }
    if (!newDriver.phone) {
        errorList[errorList.length] = "Please enter phone";
    }
    if (!newDriver.password) {
        errorList[errorList.length] = "Please enter password";
    }
    if (!newDriver.confirmPassword) {
        errorList[errorList.length] = "Please re-enter password in Confirm Password field";
    }
    if (!(newDriver.password == newDriver.confirmPassword)) {
        errorList[errorList.length] = "Password and Confirm Password did not match";
    }

    if (errorList.length > 0) {
        result = {
            status: false,
            errors: errorList
        }
        return result;
    }
    else {
        return { status: true };
    }

}


const updateDriver = async (req, res) => {
    console.log(req.body);
    let newDriver = req.body;

    let DriverValidStatus = isDriverValid(newDriver);
    if (!DriverValidStatus.status) {
        res.status(400).json({
            message: 'error',
            errors: DriverValidStatus.errors
        });
    }
    else {
        try {

            const updatedDriver = await Driver.updateOne({ _id: req.params.id }, { $set: { "phone": req.body.phone, "department": req.body.department } });

            const updateduser = await User.updateOne({ _id: req.body.user_id }, { $set: { "firstName": req.body.firstName, "lastName": req.body.lastName,"phone":req.body.phone, "username": req.body.username, "password": req.body.password } });

            res.status(201).json({ message: 'success' });
        } catch (error) {
            res.status(400).json({ message: 'error', errors: [error.message] });
        }
    }
}

const getClientByuser_id = async (req, res) => {
    try {
        const Client = await Client.findOne({user_id : req.params.id}).populate('user_id');
        res.json(Client);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}


const isClientValid = (newClient) => {
    let errorList = [];
    if (!newClient.firstName) {
        errorList[errorList.length] = "Please enter first name";
    }
    if (!newClient.lastName) {
        errorList[errorList.length] = "Please enter last name";
    }
    if (!newClient.phone) {
        errorList[errorList.length] = "Please enter phone";
    }
    if (!newClient.password) {
        errorList[errorList.length] = "Please enter password";
    }
    if (!newClient.confirmPassword) {
        errorList[errorList.length] = "Please re-enter password in Confirm Password field";
    }
    if (!(newClient.password == newClient.confirmPassword)) {
        errorList[errorList.length] = "Password and Confirm Password did not match";
    }
    if (!newClient.phone) {
        errorList[errorList.length] = "Please enter phone";
    }

    if (errorList.length > 0) {
        result = {
            status: false,
            errors: errorList
        }
        return result;
    }
    else {
        return { status: true };
    }

}


const updateClient = async (req, res) => {
    let newClient = req.body;
    let ClientValidStatus = isClientValid(newClient);
    if (!ClientValidStatus.status) {
        res.status(400).json({
            message: 'error',
            errors: ClientValidStatus.errors
        });
    }
    else {
        try {
            const updatedClient = await Client.updateOne({ _id: req.params.id }, { $set: { "phone": req.body.phone, "address": req.body.address, "gender": req.body.gender,"dob": req.body.dob } });

            const updateduser = await User.updateOne({ _id: req.body.user_id }, { $set: { "firstName": req.body.firstName, "lastName": req.body.lastName,"phone":req.body.phone, "username": req.body.username, "password": req.body.password } });

            res.status(201).json({ message: 'success' });
        } catch (error) {
            res.status(400).json({ message: 'error', errors: [error.message] });
        }
    }
}


module.exports = {
    getAdminByuser_id,
    updateAdmin,
    getDriverByuser_id,
    updateDriver,
    getClientByuser_id,
    updateClient,
}