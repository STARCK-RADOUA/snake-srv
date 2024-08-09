const Address = require('../models/Address');
const User = require('../models/User');

// Get all addresses
exports.getAllAddresses = async (req, res) => {
    try {
        const addresses = await Address.find().populate('user_id');
        res.status(200).json(addresses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
};

// Get an address by ID
exports.getAddressById = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id).populate('user_id');
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }
        res.status(200).json(address);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch address' });
    }
};

// Create a new address
exports.createAddress = async (req, res) => {
    try {
        const { user_id, address_line, building, floor, door_number, digicode, comment } = req.body;
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newAddress = new Address({ user_id, address_line, building, floor, door_number, digicode, comment });
        await newAddress.save();
        res.status(201).json(newAddress);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create address' });
    }
};

// Update an address
exports.updateAddress = async (req, res) => {
    try {
        const { user_id, address_line, building, floor, door_number, digicode, comment } = req.body;
        const address = await Address.findByIdAndUpdate(req.params.id, { user_id, address_line, building, floor, door_number, digicode, comment }, { new: true });

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.status(200).json(address);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update address' });
    }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findByIdAndDelete(req.params.id);
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }
        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete address' });
    }
};

