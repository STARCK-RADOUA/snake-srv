const User = require("../models/User.js");
const Client = require("../models/Client.js");
const Driver = require("../models/Driver.js");

const getAdminByUser_id = async (req, res) => {
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
    if (!newUser.email) {
        errorList[errorList.length] = "Please enter email";
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
    let UserValidStatus = isAdminValid(newUser);
    if (!UserValidStatus.status) {
        res.status(400).json({
            message: 'error',
            errors: UserValidStatus.errors
        });
    }
    else {
        try {
            const updatedUser = await User.updateOne({ _id: req.params.id }, { $set: req.body });
            res.status(201).json({ message: 'success' });
        } catch (error) {
            res.status(400).json({ message: 'error', errors: [error.message] });
        }
    }
}


const getDriverByUser_id = async (req, res) => {
    //console.log(req.params.id);
    try {
        const Driver = await Driver.findOne({User_id : req.params.id}).populate('User_id');
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
    if (!newDriver.email) {
        errorList[errorList.length] = "Please enter email";
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

            const updatedUser = await User.updateOne({ _id: req.body.User_id }, { $set: { "firstName": req.body.firstName, "lastName": req.body.lastName,"email":req.body.email, "Username": req.body.Username, "password": req.body.password } });

            res.status(201).json({ message: 'success' });
        } catch (error) {
            res.status(400).json({ message: 'error', errors: [error.message] });
        }
    }
}

const getClientByUser_id = async (req, res) => {
    try {
        const Client = await Client.findOne({User_id : req.params.id}).populate('User_id');
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
    if (!newClient.email) {
        errorList[errorList.length] = "Please enter email";
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

            const updatedUser = await User.updateOne({ _id: req.body.User_id }, { $set: { "firstName": req.body.firstName, "lastName": req.body.lastName,"email":req.body.email, "Username": req.body.Username, "password": req.body.password } });

            res.status(201).json({ message: 'success' });
        } catch (error) {
            res.status(400).json({ message: 'error', errors: [error.message] });
        }
    }
}


module.exports = {
    getAdminByUser_id,
    updateAdmin,
    getDriverByUser_id,
    updateDriver,
    getClientByUser_id,
    updateClient,
}