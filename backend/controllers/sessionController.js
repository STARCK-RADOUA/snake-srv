const Session = require('../models/Session');
const User = require('../models/User');

// Get all sessions
exports.getAllSessions = async (req, res) => {
    try {
        const sessions = await Session.find().populate('user_id');
        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
};

// Get a session by ID
exports.getSessionById = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id).populate('user_id');
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.status(200).json(session);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch session' });
    }
};

// Create a new session
exports.createSession = async (req, res) => {
    try {
        const { user_id, token, expires_at } = req.body;
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newSession = new Session({ user_id, token, expires_at });
        await newSession.save();
        res.status(201).json(newSession);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create session' });
    }
};

// Update a session
exports.updateSession = async (req, res) => {
    try {
        const { token, expires_at } = req.body;
        const session = await Session.findByIdAndUpdate(req.params.id, { token, expires_at }, { new: true });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.status(200).json(session);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update session' });
    }
};

// Delete a session
exports.deleteSession = async (req, res) => {
    try {
        const session = await Session.findByIdAndDelete(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete session' });
    }
};


exports.getUserIdByDeviceId = async (req, res) => {
    try {
        const { deviceId } = req.body;

        // Find the user with the provided device ID
        const user = await User.findOne({ deviceId: deviceId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return the user_id
        res.status(200).json({ userId: user._id });
    } catch (error) {
        console.error('Error fetching user ID:', error);
        res.status(500).json({ error: 'Failed to fetch user ID' });
    }
};

// Get user details by device ID
exports.getUserDetailsByDeviceId = async (req, res) => {
    try {
        const { deviceId } = req.body;

        // Find the user with the provided device ID
        const user = await User.findOne({ deviceId: deviceId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return the user details
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};
