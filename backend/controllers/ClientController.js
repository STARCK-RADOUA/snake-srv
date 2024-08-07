const Client = require("../models/Client.js");
const Product = require("../models/Product.js");
const User = require("../models/user.js");

const getClients = async (req, res) => {

    try {
        var searchClient = new RegExp(req.query.name, 'i');

        let Clients = [];
        if (!searchClient) {
            Clients = await Client.find({}).populate('userId');

        } else {
            Clients = await Client.find().populate({
                path: 'userId',
                select: 'firstName lastName email username',
                match: {
                    $or: [
                        { firstName: { $regex: searchClient } },
                        { lastName: { $regex: searchClient } },
                        { email: { $regex: searchClient } }
                    ]
                }
            }).then((Clients) => Clients.filter((Client => Client.userId != null)));
        }

        res.json(Clients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getClientById = async (req, res) => {
    try {
        const Client = await Client.findById(req.params.id).populate('userId');
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

const saveClient = async (req, res) => {
    let newClient = req.body;
    let ClientValidStatus = isClientValid(newClient);
    if (!ClientValidStatus.status) {
        res.status(400).json({
            message: 'error',
            errors: ClientValidStatus.errors
        });
    }
    else {
        //const Client = new Client(req.body);
        User.create(
            {
                email: newClient.email,
                username: newClient.username,
                firstName: newClient.firstName,
                lastName: newClient.lastName,
                password: newClient.password,
                userType: 'Client',
                activated: 1,
            },
            (error, userDetails) => {
                if (error) {
                    res.status(400).json({ message: "error", errors: [error.message] });
                } else {
                    newClient.userId = userDetails._id,
                        Client.create(newClient,
                            (error2, ClientDetails) => {
                                if (error2) {
                                    User.deleteOne({ _id: userDetails });
                                    res.status(400).json({ message: 'error', errors: [error2.message] });
                                } else {
                                    res.status(201).json({ message: 'success' });
                                }
                            }
                        );
                }
            }
        );
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
            const updatedClient = await Client.updateOne({ _id: req.params.id }, { $set: { "phone": req.body.phone, "address": req.body.address, "gender": req.body.gender, "dob": req.body.dob } });

            const updateduser = await User.updateOne({ _id: req.body.userId }, { $set: { "firstName": req.body.firstName, "lastName": req.body.lastName, "email": req.body.email, "username": req.body.username, "password": req.body.password } });

            res.status(201).json({ message: 'success' });
        } catch (error) {
            res.status(400).json({ message: 'error', errors: [error.message] });
        }
    }
}

const deleteClient = async (req, res) => {
    try {
        const Client = await Client.findById(req.params.id).populate('userId');

        if (!Client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const deletedClient = await Client.deleteOne({ _id: req.params.id });

        const deletedUser = await User.deleteOne({ _id: Client.userId });

        res.status(200).json(deletedClient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}


const getClientHistory = async (req, res) => {
    try {
        let Products = await Product.find().populate({
            path: 'productElements.medicineId',
        }).populate({
            path: 'OrderId',
            match: {ClientId:req.params.id},
            populate: [
                {
                    path: 'ClientId',
                    populate: {
                        path: 'userId'
                    }
                },
                {
                    path: 'DriverId',
                    populate: {
                        path: 'userId'
                    }
                }
            ]
        }).then((Products) => Products.filter((pre => pre.OrderId != null)));

        res.status(200).json({
            "message":"success",
            "Products":Products
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}


module.exports = {
    getClients,
    getClientById,
    saveClient,
    updateClient,
    deleteClient,
    getClientHistory
}