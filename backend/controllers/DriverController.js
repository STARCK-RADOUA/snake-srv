const Driver = require("../models/Driver.js");
const User = require("../models/User.js");
const { getActivatedStatus, editActivatedStatus } = require("../controllers/UserController");




const crypto = require('crypto');

const getDrivers = async (req, res) => {
    try {
        const searchDriver = req.query.name ? new RegExp(req.query.name, 'i') : null;

        let Drivers;
        if (searchDriver) {
            Drivers = await Driver.find().populate({
                path: 'User_id',
                select: 'firstName lastName email Username activated',
                match: {
                    $or: [
                        { firstName: { $regex: searchDriver } },
                        { lastName: { $regex: searchDriver } },
                        { email: { $regex: searchDriver } }
                    ]
                }
            }).then(Drivers => Drivers.filter(Driver => Driver.User_id != null));
        } else {
            Drivers = await Driver.find({}).populate('User_id', 'firstName lastName email Username activated');
        }

        // Ajout de la propriété activated à chaque médecin
        for (let Driver of Drivers) {
            if (Driver.User_id && Driver.User_id.activated !== undefined) {
                Driver = Driver.toObject();  // Convertir en objet JS standard pour ajouter la propriété
                Driver.activated = Driver.User_id.activated;
            } else {
                const { activated } = await getActivatedStatus(Driver.User_id._id);
                Driver = Driver.toObject();  // Convertir en objet JS standard pour ajouter la propriété
                Driver.activated = activated;
            }
        }

        res.json(Drivers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getDriverById = async (req, res) => {
    //console.log(req.params.id);
    try {
        const Driver = await Driver.findById(req.params.id).populate('User_id');
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
const saveVerificationToken = async (User_id, verificationToken) => {
    await User.findOneAndUpdate({ _id: User_id }, { "verificationToken": verificationToken });
    return;
}
const generateVerificationToken = () => {
    const token = crypto.randomBytes(64).toString('hex');
    const expires = Date.now() + 3 * 60 * 60 * 1000; // 3 hours from now
    let verificationToken = {
        "token": token,
        "expires": expires
    };
    return verificationToken;
};

const editDriverActivatedStatus = async (req, res) => {
    try {
       
        const { activated } = req.body;
        const Driver = await Driver.findById(req.params.User_id).populate('User_id');

        // Modifier l'état "activated" de l'utilisateur
        await editActivatedStatus(Driver.User_id._id, activated);

        res.status(200).json({ message: "Statut 'activated' mis à jour avec succès" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const saveDriver = async (req, res) => {
    let newDriver = req.body;

    let DriverValidStatus = isDriverValid(newDriver);
    if (!DriverValidStatus.status) {
        res.status(400).json({
            message: 'error',
            errors: DriverValidStatus.errors
        });
    }
    else {

        User.create(
            {
                email: newDriver.email,
                Username: newDriver.Username,
                firstName: newDriver.firstName,
                lastName: newDriver.lastName,
                password: newDriver.password,
                UserType: 'Driver',
                activated: true,
            },
           

            (error, UserDetails) => {
                if (error) {
                    res.json({ message: "error", errors: [error.message] });
                } else {
                    let verificationToken = generateVerificationToken()
                    saveVerificationToken(UserDetails._id, verificationToken);

                  
                        Driver.create(
                            {
                                User_id: UserDetails._id,
                                firstName: newDriver.firstName,
                                lastName: newDriver.lastName,
                                email: newDriver.email,
                                Username: newDriver.email,
                                department: newDriver.department,
                                phone: newDriver.phone ,
                                imageUrls : newDriver.imageUrls ,
                            },
                            (error2, DriverDetails) => {
                                if (error2) {
                                    User.deleteOne({ _id: UserDetails });
                                    res.json({ message: "error", errors: [error2.message] });
                                } else {
                                   
                                    res.json({ message: "success" });
                                }
                            }
                        );}});













        
    }
}

const updateDriver = async (req, res) => {
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

            const updatedUser = await User.updateOne({ _id: req.body.User_id }, { $set: { "firstName": req.body.firstName, "lastName": req.body.lastName, "email": req.body.email, "Username": req.body.Username, "password": req.body.password } });

            res.status(201).json({ message: 'success' });
        } catch (error) {
            res.status(400).json({ message: 'error', errors: [error.message] });
        }
    }
}

const deleteDriver = async (req, res) => {
    try {
        const Driver = await Driver.findById(req.params.id).populate('User_id');

        const deletedDriver = await Driver.deleteOne({ _id: req.params.id });

        const deletedUser = await User.deleteOne({ _id: Driver.User_id._id });
        res.status(200).json();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    getDrivers,
    getDriverById,
    saveDriver,
    updateDriver,
    editDriverActivatedStatus,
    deleteDriver
}