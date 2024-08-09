const Client = require('../models/Client');
const User = require('../models/User');

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
            }).then((Clients) => Clients.filter((Client => Client.user_id != null)));
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

// Create a new client
exports.isClientValid = (newClient) => {
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

exports.saveClient = async (req, res) => {
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
                phone: newClient.phone,
                
                firstName: newClient.firstName,
                lastName: newClient.lastName,
                
                userType: 'Client',
                activated: 0,
            },
            (error, userDetails) => {
                if (error) {
                    res.status(400).json({ message: "error", errors: [error.message] });
                } else {
                    newClient.user_id = userDetails._id,
                        Client.create(newClient,
                            (error2, ClientDetails) => {
                                if (error2) {
                                    User.deleteOne({ _id: userDetails._id });
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

exports.updateClient = async (req, res) => {
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
            await Client.updateOne({ _id: req.params.id }, { $set: { "additional_client_info": req.body.additional_client_info,  } });

            await User.updateOne({ _id: req.body.user_id }, { $set: { "firstName": req.body.firstName, "lastName": req.body.lastName, "phone": req.body.phone} });

            res.status(201).json({ message: 'success' });
        } catch (error) {
            res.status(400).json({ message: 'error', errors: [error.message] });
        }
    }
}

exports.deleteClient = async (req, res) => {
    try {
        const Client = await Client.findById(req.params.id).populate('user_id');

        if (!Client) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const deletedClient = await Client.deleteOne({ _id: req.params.id });

         await User.deleteOne({ _id: Client.user_id });

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
            match: {ClientId:req.params.id},
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
        }).then((Products) => Products.filter((pre => pre.OrderId != null)));

        res.status(200).json({
            "message":"success",
            "Products":Products
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}
