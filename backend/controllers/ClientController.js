const Client = require('../models/Client');
const User = require('../models/User');

// Get all clients
exports.getAllClients = async (req, res) => {
    try {
        const clients = await Client.find().populate('user_id');
        res.status(200).json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

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
exports.createClient = async (req, res) => {
    try {
        const { user_id, additional_client_info } = req.body;
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newClient = new Client({ user_id, additional_client_info });
        await newClient.save();
        res.status(201).json(newClient);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create client' });
    }
};

// Update a client
exports.updateClient = async (req, res) => {
    try {
        const { additional_client_info } = req.body;
        const client = await Client.findByIdAndUpdate(req.params.id, { additional_client_info }, { new: true });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.status(200).json(client);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update client' });
    }
};

// Delete a client
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.status(200).json({ message: 'Client deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete client' });
    }
};
