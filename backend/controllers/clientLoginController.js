
const User = require("../models/User");
const notificationController  =require('./notificationController');
const historiqueUtils  =require('./historiqueUtils');

const bcrypt = require("bcrypt");

const isLoginValid = (phone, password) => {
    const errorList = [];
    const phoneRegex = /^(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}$/; // Example pattern for a 10-digit phone number

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (!phone) {
        errorList.push("Please enter email");
    } else if (!phoneRegex.test(phone)) {
        errorList.push("Invalid phone format");
    }

    if (!password) {
        errorList.push("Please enter password");
    }
    // else if (!passwordRegex.test(password)) {
    //     errorList.push(
    //         "Password should be at least 8 characters long and contain at least one letter and one number"
    //     );
    // }

    if (errorList.length > 0) {
        return { status: false, errors: errorList };
    } else {
        return { status: true };
    }
};
const loginUser = (req, res) => {
    const { phone, password, deviceId, location } = req.body;

    const loginValidStatus = isLoginValid(phone, password);
    if (!loginValidStatus.status) {
        return res.status(400).json({ message: "error", errors: loginValidStatus.errors });
    } else {
        User.findOne({ phone: phone, deviceId: deviceId }, (error, user) => {
            if (error) {
                const username = "inconu";
                const targetScreen = ' Notifications';
                const title = '🚨 Tentative de Connexion Non Autorisée';
                const messageBody = `👤  sans compte a tenté de se connecter manuellement.\n\n❗ Veuillez vérifier les détails de la tentative de connexion :\n\n📞 Téléphone : ${phone}\n📱 Device ID : ${deviceId}\n\nPrenez les mesures nécessaires.`;
                
                notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);

                return res.status(400).json({ message: "error", errors: [error.message] });
            } else if (!user) {
                const username = "inconu";
                const targetScreen = ' Notifications';
                const title = '🚨 Tentative de Connexion Non Autorisée';
                const messageBody = `👤  sans compte a tenté de se connecter manuellement.\n\n❗ Veuillez vérifier les détails de la tentative de connexion :\n\n📞 Téléphone : ${phone}\n📱 Device ID : ${deviceId}\n\nPrenez les mesures nécessaires.`;
                
                notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);

                return res.status(401).json({ message: "error", errors: ["User not found"] });
            } else {
                bcrypt.compare(password, user.password, (error2, result) => {
                    if (error2) {
                        return res.status(401).json({ message: "error", errors: [error2.message] });
                    } else if (!result) {
                        return res.status(401).json({ message: "error", errors: ["Invalid password"] });
                    } else if (user.activated === false) {
                        const username = user.lastName + ' ' + user.firstName;
                        const targetScreen = ' Notifications';
                        const title = '🔔 Tentative de Connexion Non Autorisée';
                        const messageBody = `👤   son compte est desactiver a tenté de se connecter manuellement.\n\n❗ Veuillez vérifier les détails de la tentative de connexion :\n\n📞 Téléphone : ${phone}\n📱 Device ID : ${deviceId}\n\nPrenez les mesures nécessaires.`;
                        
                    
     notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
                        return res.status(401).json({ message: "error", errors: ["Votre compte n'est pas encore activé"] });
                    } else {
                        const currentUser = {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            userType: user.userType,
                            userId: user._id,
                        };

                        // Update the user's isLogin status
                        User.findOneAndUpdate({ _id: user._id }, { isLogin: true }, (updateError) => {
                            if (updateError) {
                                return res.status(500).json({ message: "error", errors: ["Failed to update login status"] });
                            }
                            const username = currentUser.lastName + ' ' + currentUser.firstName;
                            const targetScreen = ' Notifications';
                            const title = '🔔 Nouvelle Connexion';
                            const messageBody = `👤votre Client vient de se connecter Manuelment.\n\n🔑 Veuillez vérifier les détails de la connexion.`;
                            
                        
         notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
          historiqueUtils.enregistrerAction({
            actionType: 'Connexion',
            description:  currentUser.lastName + ' ' + currentUser.firstName+'👤 vient de se connecter.\n\n🔑',
            utilisateurId: currentUser._id, // Remplacez par un ID valide
            location: location.latitude+" "+location.longitude, // Remplacez par un ID valide
            objetType: 'Client'
        });

                            // Send a single response after the update
                            return res.json({ message: "success", user: currentUser });
                        });
                    }
                });
            }
        });
    }
};


module.exports = {
    loginUser
}