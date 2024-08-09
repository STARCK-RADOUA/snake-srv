const Admin = require('../models/Admin');
const User = require('../models/User');

// Get all admins
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().populate('user_id');
        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
};

// Get an admin by ID
exports.getAdminById = async (req, res) => {
    try {
        const admin = await Admin.findById(req.params.id).populate('user_id');
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admin' });
    }
};

// Create a new admin
exports.createAdmin = async (req, res) => {
    try {
        const { user_id, additional_admin_info } = req.body;
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newAdmin = new Admin({ user_id, additional_admin_info });
        await newAdmin.save();
        res.status(201).json(newAdmin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create admin' });
    }
};

// Update an admin
exports.updateAdmin = async (req, res) => {
    try {
        const { additional_admin_info } = req.body;
        const admin = await Admin.findByIdAndUpdate(req.params.id, { additional_admin_info }, { new: true });

        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update admin' });
    }
};

// Delete an admin
exports.deleteAdmin = async (req, res) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);
        if (!admin) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete admin' });
    }
};
