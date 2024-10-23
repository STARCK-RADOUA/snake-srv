// controllers/loginController.js
const notificationController  =require('./notificationController');
const historiqueUtils  =require('./historiqueUtils');
const User = require('../models/User');
const Warn = require('../models/Warn');

const autoLogin = async (socket, { deviceId ,location },io) => {
    try {
        console.log('Auto Login :', deviceId);
        console.log('------------------------------------');
        console.log(location);
        console.log('------------------------------------');
        // Find the user in the database using the device ID
        const user = await User.findOne({ deviceId, userType: 'Client'});

        if (!user) {
            await Warn.create({
                phone: '000000000',
                firstName: "Unknown",
                lastName: "Unknown",
                deviceId: deviceId,
                location: location.latitude+" "+location.longitude,
                password: "Unknown",
               
            });
            const username = "Unknown" + ' ' + "Unknown";
            const targetScreen = ' Notifications';
            const title = '🚨 Tentative d etulisation Non Autorisée';
            const messageBody = `👤  Warn a tenté de etuliser votre app.\n\n❗ Veuillez vérifier les détails de la tentative  :\n\n📞 Téléphone : ${"Unknown"}\n📱 Device ID : ${deviceId}\n📍 Localisation : latitude :${location.latitude}, longitude : ${location.longitude}\n\nPrenez les mesures nécessaires.`;
            
            await notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
         
            socket.emit('loginFailure', { message: ' No User account ' });
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
        await historiqueUtils.enregistrerAction({
            actionType: 'Connexion',
            description:  user.lastName + ' ' + user.firstName+'👤 vient de se connecter.\n\n🔑',
            utilisateurId: user._id, // Remplacez par un ID valide
            location: location.latitude+" "+location.longitude, // Remplacez par un ID valide
            objetType: 'Client'
        });



        // Si tout va bien, l'utilisateur est connecté
        io.to(deviceId).emit('loginSuccess', { userId: user._id, message: 'Login successful' });

   
    } catch (error) {
        console.error('Error during auto-login:', error);
        socket.emit('loginFailure', { message: 'Login failed due to server error.' });
    }
};
const autoLoginDriver = async (socket, { deviceId }) => {
    try {
        const driverUser = await User.findOne({ deviceId:deviceId, userType: 'Driver'});

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
         
    
            await historiqueUtils.enregistrerAction({
                actionType: 'Connexion',
                description:  driverUser.lastName + ' ' + driverUser.firstName+'👤 vient de se connecter.\n\n🔑',
                utilisateurId: driverUser._id, // Remplacez par un ID valide
                objetType: 'Driver'
            });
    
            // Si tout va bien, l'utilisateur est connecté
            socket.emit('loginSuccess', { userId: driverUser._id, message: 'Login successful' });
    
         
   
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
                socket.emit('activationStatus', {  none: true ,activated: true, message: 'User is activated.' });
            } else if (!user.activated) {
                socket.emit('activationStatus', { none: true, activated: false, message: 'User is not activated.' });
            }
        } else {
            socket.emit('activationStatus', { none: false, activated: false, message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error during activation check:', error);
        socket.emit('activationStatus', { none: false, activated: false, message: 'Server error during activation check.' });
    }
};

module.exports = {
    autoLogin,
    checkUserActivation,
    autoLoginDriver,
};
