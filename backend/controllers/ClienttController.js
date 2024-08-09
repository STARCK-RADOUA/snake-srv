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

// Get a single client by ID
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
exports.createClient = async
