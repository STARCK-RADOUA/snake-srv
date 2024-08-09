const Referral = require('../models/Referral');
const User = require('../models/User');

// Get all referrals
exports.getAllReferrals = async (req, res) => {
    try {
        const referrals = await Referral.find().populate('user_id');
        res.status(200).json(referrals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch referrals' });
    }
};

// Get a referral by ID
exports.getReferralById = async (req, res) => {
    try {
        const referral = await Referral.findById(req.params.id).populate('user_id');
        if (!referral) {
            return res.status(404).json({ error: 'Referral not found' });
        }
        res.status(200).json(referral);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch referral' });
    }
};

// Create a new referral
exports.createReferral = async (req, res) => {
    try {
        const { user_id, code, referred_by } = req.body;
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newReferral = new Referral({ user_id, code, referred_by });
        await newReferral.save();
        res.status(201).json(newReferral);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create referral' });
    }
};

// Update a referral
exports.updateReferral = async (req, res) => {
    try {
        const { code, referred_by } = req.body;
        const referral = await Referral.findByIdAndUpdate(req.params.id, { code, referred_by }, { new: true });

        if (!referral) {
            return res.status(404).json({ error: 'Referral not found' });
        }

        res.status(200).json(referral);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update referral' });
    }
};

// Delete a referral
exports.deleteReferral = async (req, res) => {
    try {
        const referral = await Referral.findByIdAndDelete(req.params.id);
        if (!referral) {
            return res.status(404).json({ error: 'Referral not found' });
        }
        res.status(200).json({ message: 'Referral deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete referral' });
    }
};
