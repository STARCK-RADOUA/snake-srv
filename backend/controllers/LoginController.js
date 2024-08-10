// controllers/loginController.js

const User = require('../models/User');

const autoLogin = async (socket, { deviceId }) => {
    try {
        // Find the user in the database using the device ID
        const user = await User.findOne({ deviceId, userType: 'Client', activated: true });

        if (user) {
            // If the user is found and is a client, return success
            socket.emit('loginSuccess', { user });
        } else {
            // If the user is not found or not a client, return failure
            socket.emit('loginFailure', { message: 'Login failed. User not found or not activated.' });
        }
    } catch (error) {
        console.error('Error during auto-login:', error);
        socket.emit('loginFailure', { message: 'Login failed due to server error.' });
    }
};
const checkUserActivation = async (socket, { deviceId }) => {
    try {
        const user = await User.findOne({ deviceId });
        console.log(user)

        if (user) {
            if (user.activated) {
                console.log(user.activated)
                socket.emit('activat2ionStatus', { activated: true, message: 'User is activated.' });
            } else {
                socket.emit('activationStatus', { activated: false, message: 'User is not activated.' });
            }
        } else {
            socket.emit('activationStatus', { activated: false, message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error during activation check:', error);
        socket.emit('activationStatus', { activated: false, message: 'Server error during activation check.' });
    }
};

module.exports = {
    autoLogin,
    checkUserActivation,
};
