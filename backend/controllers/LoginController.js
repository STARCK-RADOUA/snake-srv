// controllers/loginController.js
const notificationController  =require('./notificationController');
const User = require('../models/User');

const autoLogin = async (socket, { deviceId }) => {
    try {
        // Find the user in the database using the device ID
        const user = await User.findOne({ deviceId, userType: 'Client'});

        if (!user) {
            const driverUser = await User.findOne({ deviceId, userType: 'Driver'});

            if(!driverUser){
                socket.emit('loginFailure', { message: 'Device ID not found' });
                return;
            }



            if (driverUser.activated === false) {
                // Si le compte de l'utilisateur est désactivé
                socket.emit('loginFailure', { message: 'User account is disabled' });
                return;
            }   
            if (driverUser.isLogin === false) {
                // Si le compte de l'utilisateur est désactivé
                socket.emit('loginFailure', { message: 'User account is logout' });
                return;
            }
            const username = driverUser.lastName + ' ' + driverUser.firstName;
            const targetScreen = ' Notifications';
            const title = '🔔 Nouvelle Connexion de Livreur🚚  ';
            const messageBody = `🚚 Livreur vient de se connecter.\n\n🔑 Veuillez vérifier les détails de la connexion.`;
            const userType = 'Driver';

            await notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
            await notificationController.sendNotification(username,targetScreen,messageBody ,title,userType);
         
    
    
    
            // Si tout va bien, l'utilisateur est connecté
            socket.emit('loginSuccess', { userId: driverUser._id, message: 'Login successful' });
    
         return;
        }

        if (user.activated === false) {
            // Si le compte de l'utilisateur est désactivé
            socket.emit('loginFailure', { message: 'User account is disabled' });
            return;
        }   
        if (user.isLogin === false) {
            // Si le compte de l'utilisateur est désactivé
            socket.emit('loginFailure', { message: 'User account is logout' });
            return;
        }
        const username = user.lastName + ' ' + user.firstName;
        const targetScreen = ' Notifications';
        const title = '🔔 Nouvelle Connexion';
        const messageBody = `👤 vient de se connecter.\n\n🔑 Veuillez vérifier les détails de la connexion.`;
        
        await notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
     



        // Si tout va bien, l'utilisateur est connecté
        socket.emit('loginSuccess', { userId: user._id, message: 'Login successful' });

   
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
