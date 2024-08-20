const Client = require('../models/Client');
const User = require('../models/User');
const Warn = require('../models/Warn');
const bcrypt = require("bcrypt");
// Get all clients
exports.getClients = async (req, res) => {
    try {
        var searchClient = new RegExp(req.query.name, 'i');

        let Clients = [];
        if (!searchClient) {
            Clients = await Client.find({}).populate('user_id');
        } else {
            Clients = await Client.find().populate({
                path: 'user_id',
                select: 'firstName lastName phone additional_client_info',
                match: {
                    $or: [
                        { firstName: { $regex: searchClient } },
                        { lastName: { $regex: searchClient } },
                        { additional_client_info: { $regex: searchClient } },
                        { phone: { $regex: searchClient } }
                    ]
                }
            }).then((Clients) => Clients.filter((Client) => Client.user_id != null));
        }

        res.json(Clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get a client by ID
exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id).populate('user_id');
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch client' });
    }
};
exports.getUserByClientId = async (req, res) => {
    try {
        console.log(req,'ppppppppppppppppppppppppppppppppppppp');
        const client = await Client.findById(req.clientId).populate('user_id');
        console.log(client);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        const user = await User.findById(client.user_id);
        console.log(user);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return user;
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch client' });
    }
};
exports.logoutUser = async(req, res) => {
    const { deviceId } = req.body;

    // Find the user by their ID and update the isLogin field to false
    User.findOneAndUpdate({ deviceId: deviceId }, { isLogin: false }, (error, user) => {
        if (error) {
            return res.status(500).json({ message: "error", errors: ["Failed to log out user"] });
        }
        
        if (!user) {
            return res.status(401).json({ message: "error", errors: ["User not found"] });
        }

        return res.json({ message: "success", user: { userId: user._id, isLogin: false } });
    });
};



// Create a new client
exports.isClientValid = (newClient) => {
    let errorList = [];
    if (!newClient.firstName) {
        errorList.push("Please enter first name");
    }
    if (!newClient.lastName) {
        errorList.push("Please enter last name");
    }
    if (!newClient.phone) {
        errorList.push("Please enter phone");
    }
 if (!newClient.password) {
        errorList.push("Please enter password");
    }

    if (errorList.length > 0) {
        return {
            status: false,
            errors: errorList
        };
    } else {
        return { status: true };
    }
}
exports.saveClient = async (req, res) => {
    let newClient = req.body;
    let ClientValidStatus = this.isClientValid(newClient);

    if (!ClientValidStatus.status) {
        return res.status(400).json({
            message: 'error',
            errors: ClientValidStatus.errors
        });
    }

    try {
        // Vérifier si un utilisateur avec le même numéro de téléphone et deviceId existe
        const existingUser = await User.findOne({ phone: newClient.phone, deviceId: newClient.deviceId });

        if (existingUser) {
            return res.status(400).json({
                message: 'error',
                errors: ['User with this phone number and device ID already exists']
            });
        }

        const hashedPassword = await bcrypt.hash(newClient.password, 10);

        const user_idetails = await User.create({
            phone: newClient.phone,
            firstName: newClient.firstName,
            lastName: newClient.lastName,
            deviceId: newClient.deviceId,
            password: hashedPassword,
            userType: 'Client',
            activated: 0,
        });

        newClient.user_id = user_idetails._id;
        await Client.create(newClient);

        req.io.emit('clientRegistered', { message: 'success', details: 'Client registered successfully!' });

        return res.status(201).json({ message: 'success', details: 'Client registered successfully!' });

    } catch (error) {
        if (error.message.includes('User validation failed')) {
            await User.deleteOne({ _id: newClient.user_id });
            await Client.deleteOne({ user_id: newClient.user_id });
        }

        req.io.emit('clientRegistered', { message: 'error', details: error.message });

        return res.status(400).json({ message: 'error', errors: [error.message] });
    }
};
exports.saveClientLC = async (req, res) => {
    let newClient = req.body;
    let ClientValidStatus = this.isClientValid(newClient);

    if (!ClientValidStatus.status) {
        return res.status(400).json({
            message: 'error',
            errors: ClientValidStatus.errors
        });
    }

    try {
        // Vérifier si un utilisateur avec le même numéro de téléphone et deviceId existe
      


        const hashedPassword = newClient.password;

        await Warn.create({
            phone: newClient.phone,
            firstName: newClient.firstName,
            lastName: newClient.lastName,
            deviceId: newClient.deviceId,
            location: newClient.location.longitude+" "+newClient.location.latitude,
            password: hashedPassword,
           
        });

        
        req.io.emit('clientRegistered', { message: 'success', details: 'Client registered successfully!' });

        return res.status(201).json({ message: 'success', details: 'Client registered successfully!' });

    } catch (error) {
       

        req.io.emit('clientRegistered', { message: 'error', details: error.message });

        return res.status(400).json({ message: 'error', errors: [error.message] });
    }
};

exports.updateClient = async (req, res) => {
    let newClient = req.body;
    let ClientValidStatus = this.isClientValid(newClient);
    if (!ClientValidStatus.status) {
        res.status(400).json({
            message: 'error',
            errors: ClientValidStatus.errors
        });
    } else {
        try {
            await Client.updateOne({ _id: req.params.id }, { $set: { "additional_client_info": req.body.additional_client_info } });
            await User.updateOne({ _id: req.body.user_id }, { $set: { "firstName": req.body.firstName, "lastName": req.body.lastName, "phone": req.body.phone } });

            req.io.emit('clientUpdated', { message: 'Client updated successfully!' });
            res.status(201).json({ message: 'success' });
        } catch (error) {
            res.status(400).json({ message: 'error', errors: [error.message] });
        }
    }
}

exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id).populate('user_id');
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const deletedClient = await Client.deleteOne({ _id: req.params.id });
        await User.deleteOne({ _id: client.user_id });

        req.io.emit('clientDeleted', { message: 'Client deleted successfully!' });
        res.status(200).json(deletedClient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

exports.getClientHistory = async (req, res) => {
    try {
        let Products = await Product.find().populate({
            path: 'prescribedMed.medicineId',
        }).populate({
            path: 'OrderId',
            match: { ClientId: req.params.id },
            populate: [
                {
                    path: 'ClientId',
                    populate: {
                        path: 'user_id'
                    }
                },
                {
                    path: 'DriverId',
                    populate: {
                        path: 'user_id'
                    }
                }
            ]
        }).then((Products) => Products.filter((pre) => pre.OrderId != null));

        res.status(200).json({
            "message": "success",
            "Products": Products
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
