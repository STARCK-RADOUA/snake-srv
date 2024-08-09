const Driver = require('../models/Driver');
const User = require('../models/User');

// Get all drivers
exports.getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find().populate('user_id');
        res.status(200).json(drivers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
};

// Get a driver by ID
exports.getDriverById = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id).populate('user_id');
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.status(200).json(driver);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch driver' });
    }
};

// Create a new driver
exports.createDriver = async (req, res) => {
    try {
        const { user_id, vehicle_type, additional_courier_info } = req.body;
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newDriver = new Driver({ user_id, vehicle_type, additional_courier_info });
        await newDriver.save();
        res.status(201).json(newDriver);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create driver' });
    }
};

// Update a driver
exports.updateDriver = async (req, res) => {
    try {
        const { vehicle_type, additional_courier_info } = req.body;
        const driver = await Driver.findByIdAndUpdate(req.params.id, { vehicle_type, additional_courier_info }, { new: true });

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        res.status(200).json(driver);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update driver' });
    }
};

// Delete a driver
exports.deleteDriver = async (req, res) => {
    try {
        const driver = await Driver.findByIdAndDelete(req.params.id);
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.status(200).json({ message: 'Driver deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete driver' });
    }
};
