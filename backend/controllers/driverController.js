const Driver = require('../models/Driver');
const User = require('../models/User');
const Order = require('../models/Order');
const Client = require('../models/Client');
const notificationController  =require('./notificationController');
const orderController  =require('./orderController');
const UserController  =require('./UserController');
const axios = require('axios');

const {getRouteDetailsByOrderAndDriver}  =require('./LocationRouteController');
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


// Create a new driver
exports.getDriverById = async (req, res) => {
    //console.log(req.params.id);
    try {
        const Driver = await Driver.findById(req.params.id).populate('user_id');
        res.json(Driver);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}


exports.isDriverValid = (newDriver) => {
    let errorList = [];
    if (!newDriver.firstName) {
        errorList[errorList.length] = "Please enter first name";
    }
    if (!newDriver.lastName) {
        errorList[errorList.length] = "Please enter last name";
    }
    if (!newDriver.phone) {
        errorList[errorList.length] = "Please enter phone";
    }
   

    if (errorList.length > 0) {
        result = {
            status: false,
            errors: errorList
        }
        return result;
    }
    else {
        return { status: true };
    }

}



exports.editDriverActivatedStatus = async (req, res) => {
    try {
       
        const { activated } = req.body;
        const Driver = await Driver.findById(req.params.user_id).populate('user_id');

        // Modifier l'état "activated" de l'utilisateur
        await editActivatedStatus(Driver.user_id, activated);

        res.status(200).json({ message: "Statut 'activated' mis à jour avec succès" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

exports.saveDriver = async (req, res) => {
    let newDriver = req.body;

    let DriverValidStatus = isDriverValid(newDriver);
    if (!DriverValidStatus.status) {
        res.status(400).json({
            message: 'error',
            errors: DriverValidStatus.errors
        });
    }
    else {

        User.create(
            {
                phone: newDriver.phone,
                
                firstName: newDriver.firstName,
                lastName: newDriver.lastName,
              
                userType: 'Driver',
                activated: false,
            },
           

            (error, user_idetails) => {
                if (error) {
                    res.json({ message: "error", errors: [error.message] });
                } else {
                   

                  
                        Driver.create(
                            {
                                user_id: user_idetails._id,
                              
                               
                               
                                additional_driver_info : newDriver.additional_driver_info ,
                            },
                            (error2, DriverDetails) => {
                                if (error2) {
                                    User.deleteOne({ _id: user_idetails._id });
                                    res.json({ message: "error", errors: [error2.message] });
                                } else {
                                   
                                    res.json({ message: "success" });
                                }
                            }
                        );}});













        
    }
}

// Update a driver
exports.updateDriver = async (req, res) => {
    let newDriver = req.body;

    let DriverValidStatus = isDriverValid(newDriver);
    if (!DriverValidStatus.status) {
        res.status(400).json({
            message: 'error',
            errors: DriverValidStatus.errors
        });
    }
    else {
        try {

            await Driver.updateOne({ _id: req.params.id }, { $set: { "additional_driver_info": req.body.additional_driver_info } });

           await User.updateOne({ _id: req.body.user_id }, { $set: { "firstName": req.body.firstName, "lastName": req.body.lastName, "phone": req.body.phone,  } });

            res.status(201).json({ message: 'success' });
        } catch (error) {
            res.status(400).json({ message: 'error', errors: [error.message] });
        }
    }
}

// Delete a driver
exports.deleteDriver = async (req, res) => {
    try {
        const Driver = await Driver.findById(req.params.id).populate('user_id');

        await Driver.deleteOne({ _id: req.params.id });

         await User.deleteOne({ _id: Driver.user_id });
        res.status(200).json();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

exports.deleteDriverFromAdmin = async (req, res) => {
    console.log("connect")
    try {
      // Find the user by ID (User ID comes from req.params.id)
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur introuvable.' });
      }
  
      // Find the driver associated with the user
      const driver = await Driver.findOne({ user_id: user._id });
      if (!driver) {
        return res.status(404).json({ message: 'Conducteur introuvable.' });
      }
  
      // Delete the driver
      await Driver.deleteOne({ _id: driver._id });
  
      // Delete the associated user
      await User.deleteOne({ _id: user._id });
  
      res.status(200).json({ message: 'Conducteur et utilisateur supprimés avec succès.' });
      const { io } = require('../index');
    const drivers = await User.find({userType : 'Driver'});
    io.emit('driversUpdated', { drivers });
    } catch (error) {
      console.error('Erreur lors de la suppression du conducteur:', error);
      res.status(400).json({ message: 'Erreur lors de la suppression du conducteur. Veuillez réessayer.' });
    }
  };
  
exports.getDriverByDeviceId = async (req, res) => {
    const { deviceId } = req.body;  // Extract deviceId from the body

    try {
        // Find the user by deviceId
        const user = await User.findOne({ deviceId });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Find the driver using user_id
        const driver = await Driver.findOne({ user_id: user._id });
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }

        // Return driver info
        return res.status(200).json({ driverId: driver._id, driverInfo: driver , user: user});
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};



exports.updateDriverAvailability = async (req, res) => {
    const { driverId, isDisponible } = req.body; // Get driverId and new availability status from the request
  
    try {
      const driver = await Driver.findById(driverId); // Find driver by ID
  
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      } 
      const user = await User.findById(driver.user_id); // Find driver by ID
  
      if (!user) {
        return res.status(404).json({ message: 'Driver not found' });
      }
  
      // Update the availability status
      driver.isDisponible = isDisponible;
      await driver.save(); // Save the updated driver
   
      if (driver) {
        driver.location.isConnected = isDisponible;
        await driver.save();

      
      }
      const username = user.lastName + ' ' + user.firstName;
      const targetScreen = ' Notifications';
      const messageBody = `🚗 Driver availability updated to ${isDisponible ? '✅ Available' : '❌ Unavailable'}`;
      const title = `🔔 Driver Availability Update`;
      
      await notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
      return res.status(200).json({ message: 'Driver availability updated successfully', driver });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


exports.updateDriverPause = async (req, res) => {
    const { driverId, isDisponible } = req.body; // Get driverId and new availability status from the request
  
    try {
      const driver = await Driver.findById(driverId); // Find driver by ID
  
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      } 
      const user = await User.findById(driver.user_id); // Find driver by ID
  
      if (!user) {
        return res.status(404).json({ message: 'Driver not found' });
      }
  
      // Update the availability status
      driver.isPause = isDisponible;
      await driver.save(); // Save the updated driver
   
      if (driver) {
        driver.location.isConnected = isDisponible;
        await driver.save();

      
      }
      const username = user.lastName + ' ' + user.firstName;
      const targetScreen = ' Notifications';
      const messageBody = `🚗 Driver pause updated to ${isDisponible ? '✅ Available' : '❌ Unavailable'}`;
      const title = `🔔 Driver pause Update`;
      
      await notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
      return res.status(200).json({ message: 'Driver ispause updated successfully', driver });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


  exports.commandeLivree = async (req, res) => {
    try {
        const { order_number,comment } = req.body;  // C'est en fait l'orderId, renommez-le pour être plus explicite
        const orderId = order_number;
console.log('------------------------------------');
console.log('orderId:', orderId);
console.log('------------------------------------');

const existingOrder = await Order.findById(orderId);
if (existingOrder.status === "delivered") {
  return res.status(400).json({ message: "error", errors: ["Commande déjà livrée"] });
}
        // Trouver la commande par son _id et mettre à jour son statut à "delivered"
        const order = await Order.findOneAndUpdate(
            { _id: orderId },
            { status: "delivered",active: false,drivercomment:comment, seen: false },
            { new: true } // Retourne la commande mise à jour
        );

        if (!order) {
            return res.status(404).json({ message: "error", errors: ["Order not found"] });
        }

        // Récupérer les informations du driver et du client associés à la commande
        const driver = await Driver.findById(order.driver_id);
        const client = await Client.findById(order.client_id);
        const driverUp = await Driver.findOneAndUpdate(
            { _id: order.driver_id },
            { orders_count: driver.orders_count-1 },
            { new: true } // Retourne la commande mise à jour
        );
        // Vérifier que le driver et le client existent
        if (!driver || !client) {
            return res.status(404).json({ message: "error", errors: ["Driver or client not found"] });
        }

        const userDriver = await User.findById(driver.user_id);
        const userClient = await User.findById(client.user_id);

        // Vérifier que les utilisateurs associés au driver et au client existent
        if (!userDriver || !userClient) {
            return res.status(404).json({ message: "error", errors: ["User for driver or client not found"] });
        }

        // Construction du message de notification
        const username = `${userDriver.lastName} ${userDriver.firstName}`;
        const targetScreen = 'Notifications';
        const title = '🚨 Commande Livrée';
        const messageBody = `👤 ${username} vient de livrer une commande.\n\n📞 Client : ${userClient.lastName} ${userClient.firstName}\n📱 Order ID : ${orderId}\n\nPrenez les mesures nécessaires. Prix total : ${order.total_price} €`;

        // Envoi de la notification
        await notificationController.sendNotificationAdmin(username, targetScreen, messageBody, title);
        const name = "Mise à jour de votre commande"; // Personnalisez le nom
        const message = `🎉 Félicitations ! Votre commande a été livrée avec succès.\n\n Nous espérons que vous apprécierez votre achat. \n\nN'oubliez pas de nous donner votre avis !`;
        const title2 = "🚚 Commande Livrée 🎉!"; // Titre de la notification
        const userType = "Client"; // Type d'utilisateur (client)
        
        await notificationController.sendNotificationForce(name, userClient.pushToken, message, title2, userType);
        const name2 = "Félicitations pour la livraison !"; // Nom pour la notification
const message2 = `💪 Excellent travail ! Vous venez de livrer avec succès une autre commande. Continuez comme ça, vous faites une différence avec chaque livraison. 🚀 On compte sur vous pour les prochaines étapes !`;
const title22 = "🚚 Félicitations Livraison Réussie 🎉!"; // Titre de la notification
const userType2 = "Driver"; // Type d'utilisateur (livreur)

await notificationController.sendNotificationForce(name2, userDriver.pushToken, message2, title22, userType2);

        const { io } = require('../index');
        io.to(userClient.deviceId).emit('orderStatusUpdates', { order });
        await orderController.watchOrders(io) ;

        return res.json({ message: "success", order: { _id: order._id, status: order.status, active: order.active } });

    } catch (error) {
        console.error("Error during processing order delivery:", error);
        return res.status(500).json({ message: "error", errors: ["Failed to process order delivery"] });
    }
};
exports.commandeRedistribuer = async (req, res) => {
  try {
      const { order_number, deviceId } = req.body;
      const orderId = order_number;

      // Fetch the order, driver, and client details
      const existingOrder = await Order.findById(orderId);
      if (!existingOrder) return res.status(404).json({ message: "error", errors: ["Order not found"] });
      
      const userDriver = await User.findOne({ deviceId });
      const currentDriver = await Driver.findOne({ user_id: userDriver._id });
      const client = await Client.findById(existingOrder.client_id);
      const userClient = await User.findById(client.user_id);

      // Check order status
      if (existingOrder.status !== "in_progress") {
          return res.status(400).json({ message: "error", errors: ["Order not in progress"] });
      }

      // Find all available drivers
      const availableDrivers = await Driver.find({ isDisponible: true,isPause: false, _id: { $ne: existingOrder.driver_id } });

      if (!availableDrivers.length) {
          return res.status(404).json({ message: "error", errors: ["No available drivers found"] });
      }

      // Variables to track the closest driver
      let closestDriver = null;
      let shortestDuration = Infinity;

      // Loop through each available driver to find the closest one
      for (const driver of availableDrivers) {
          const result = await getRouteDetailsByOrderAndDriver(orderId, driver._id);
          
          // If there's an error, skip to the next driver
          if (result.error) continue;

          const { duration } = result;
console.log('------------------------------------');
console.log('wa haa duration ', duration);
console.log('------------------------------------');
          // Check if the route is within 20 minutes and if it’s the shortest duration found
          if (duration <= 20 && duration < shortestDuration) {
              shortestDuration = duration;
              closestDriver = driver;
          }
      }

      // If no driver is found within 20 minutes, return an error
      if (!closestDriver) {
          return res.status(404).json({ message: "error", errors: ["No drivers within 20 minutes found"] });
      }
   const driverUp = await Driver.findOneAndUpdate(
        { _id: currentDriver._id },
        { orders_count: currentDriver.orders_count-1 },
        { new: true } // Retourne la commande mise à jour
    );
       const driverUp2 = await Driver.findOneAndUpdate(
        { _id: closestDriver._id },
        { orders_count: closestDriver.orders_count+1 },
        { new: true } // Retourne la commande mise à jour
    );
      // Assign the closest driver to the order
      existingOrder.driver_id = closestDriver._id;
      existingOrder.seen = false ;
      await existingOrder.save();
      const newDriver = await User.findById(closestDriver.user_id );


      // Notify client and update order status
      const username = `${userDriver.lastName} ${userDriver.firstName}`;
      const username2 = `${newDriver.lastName} ${newDriver.firstName}`;
      const targetScreen = 'Notifications';
      const title = '🚨 Commande Redistribuée';
      const messageBody = `👤 ${username} a redistribué une commande.\n\n📞 Client : ${userClient.lastName} ${userClient.firstName}\n📱 Order ID : ${orderId}\n\nPrenez les mesures nécessaires. Prix total : ${existingOrder.total_price} €  \n\nle new livreur  : ${username2}  duree :${shortestDuration} `;

      await notificationController.sendNotificationAdmin(username, targetScreen, messageBody, title);

      // Emit real-time update to the client
      const { io } = require('../index');
      io.to(userClient.deviceId).emit('orderStatusUpdates', { order: existingOrder });
      await orderController.watchOrders(io) ;

      return res.json({ message: "success", order: { _id: existingOrder._id, status: existingOrder.status, active: existingOrder.active } });

  } catch (error) {
      console.error("Error redistributing order:", error);
      return res.status(500).json({ message: "error", errors: ["Failed to redistribute order"] });
  }
};
// Fonction pour obtenir la distance
const getDistanceS = async (startLat, startLng, endLat, endLng) => {
  const osrmUrl = `http://192.168.8.159:5000/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`;

  try {
    const response = await axios.get(osrmUrl, { timeout: 10000 });
    const data = response.data;

    if (data.code === 'Ok' && data.routes.length > 0) {
      const route = data.routes[0];
      return { distance: (route.distance / 1000).toFixed(2) }; // Convertir en km
    } else {
      throw new Error('Error retrieving route data.');
    }
  } catch (error) {
    console.error(error);
    return { distance: 'que quelques' };
  }
};

// Fonction pour gérer la requête
exports.getDistance = async (req, res) => {
  const { startLat, startLng, endLat, endLng } = req.body;

  // Vérification des paramètres
  if (!startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ error: 'Paramètres manquants' }); // Si un paramètre est manquant, renvoyer une erreur 400
  }

  try {
    // Appeler la fonction de calcul de distance
    const result = await getDistanceS(parseFloat(startLat), parseFloat(startLng), parseFloat(endLat), parseFloat(endLng));
    res.json(result); // Réponse avec la distance
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors du calcul de la distance' }); // Erreur interne serveur
  }
};

exports.logoutUser = async (req, res) => {
    try {
        const { deviceId } = req.body;
        const { io } = require('../index');

        // Trouver l'utilisateur par son deviceId et mettre à jour le champ isLogin à false
        const user1 = await User.findOneAndUpdate(
            { deviceId: deviceId },
            { isLogin: false, activated: false }, // Combinez vos mises à jour ici
            { new: true } // Option pour retourner l'utilisateur mis à jour
        );
        
      

        if (!user1) {
            return res.status(401).json({ message: "error", errors: ["User not found"] });
        }

  
   

      
                await User.findOneAndUpdate(
                    { deviceId: deviceId },
                    { activated: false },
                    { new: true });

                    await UserController.watchActivition(io) ;

                        // Optionally, update the driver's `isConnected` status to false upon disconnect
                        const user = await User.findOne({ deviceId});
                        if (user && user.userType === "Driver") {
                          const driver = await Driver.findOne({ user_id: user._id });
                          if (driver) {
                            driver.location.isConnected = false;
                            driver.isDisponible = false;
                            await driver.save();

                            io.emit('locationUpdateForAdmin', {
                              driverId: user.deviceId,
                              latitude: driver.location.latitude,
                              longitude: driver.location.longitude,
                              isConnected: driver.location.isConnected,
                              isDisponible: driver.isDisponible
                            });
                            
                          }
                
                 console.log('------------------------------------');
                   console.log("discon",user.lastName);
                   console.log('------------------------------------');
                
                   console.log(`Le livreur avec le deviceId ${user.deviceId}    mr ${user.lastName}  ${user.firstName}est déconnecté.`);
                
                   // Appeler la fonction pour réinitialiser les commandes et le statut du livreur
                   const result = await orderController.resetOrdersAndDriverByDeviceId(user.deviceId);
                
                   if (result.success) {
                     console.log(`Le livreur ${result.driver.lastName} a été déconnecté, et ${result.ordersUpdated} commandes ont été réinitialisées.`);
                     await orderController.assignPendingOrders();
                     // Notifier les autres clients si nécessaire
                     io.emit('driverDisconnected', { driverId: result.driver, message: 'Le livreur a été déconnecté et ses commandes ont été réassignées.' });
                   } else {
                     console.error(`Erreur lors de la déconnexion du livreur : ${result.message}`);
                   }
                
                          
                        }
                  
                
                
                
                
                
                
                
                
                
                
                
                
                const username = user.lastName + ' ' + user.firstName;
                const targetScreen = ' Notifications';
                const title = '!!🚨!! Attention Déconnexion de Livreur';
                const messageBody = `👤 livreur vient de se déconnecter.\n\n📞 Téléphone : ${user.phone}\n📱 Device ID : ${deviceId}\n\nPrenez les mesures nécessaires.`;
                      
                await notificationController.sendNotificationAdmin(username, targetScreen, messageBody, title)
    


                await orderController.watchOrders(io) ;






        return res.json({ message: "success", user: { userId: user._id, isLogin: false } });
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ message: "error", errors: ["Failed to log out user"] });
    }
};



  exports.commandeCanceled = async (req, res) => {
    try {
        const { order_number,reportReason, comment,isChecked  } = req.body;  // C'est en fait l'orderId, renommez-le pour être plus explicite
        const orderId = order_number;
console.log('------------------------------------');
console.log('orderId to canceled...:', orderId);
console.log('orderId to canceled...:', reportReason);
console.log('orderId to canceled...:', comment);
console.log('------------------------------------');
        // Trouver la commande par son _id et mettre à jour son statut à "delivered"
        const order = await Order.findOneAndUpdate(
            { _id: orderId },
            { status: "cancelled",active: false ,report_reason: reportReason,report_comment: comment,spam: isChecked, seen: false },
            { new: true } // Retourne la commande mise à jour
        );

        if (!order) {
            return res.status(404).json({ message: "error", errors: ["Order not found"] });
        }
       

        // Récupérer les informations du driver et du client associés à la commande
        const driver = await Driver.findById(order.driver_id);
        const client = await Client.findById(order.client_id);
        const driverUp = await Driver.findOneAndUpdate(
            { _id: order.driver_id },
            { orders_count: driver.orders_count-1 },
            { new: true } // Retourne la commande mise à jour
        );
        // Vérifier que le driver et le client existent
        if (!driver || !client) {
            return res.status(404).json({ message: "error", errors: ["Driver or client not found"] });
        }

        const userDriver = await User.findById(driver.user_id);
        const userClient = await User.findById(client.user_id);

        // Vérifier que les utilisateurs associés au driver et au client existent
        if (!userDriver || !userClient) {
            return res.status(404).json({ message: "error", errors: ["User for driver or client not found"] });
        }

        // Construction du message de notification
        const username = `${userDriver.lastName} ${userDriver.firstName}`;
        const targetScreen = 'Notifications';
        const title = '🚨 Commande Annuler';
        const messageBody = `👤 ${username} vient de annuler une commande.\n\n📞 Client : ${userClient.lastName} ${userClient.firstName}\n📱 Order ID : ${orderId}\n\nPrenez les mesures nécessaires. Prix total : ${order.total_price} €`;

        // Envoi de la notification
        await notificationController.sendNotificationAdmin(username, targetScreen, messageBody, title);
        if(isChecked){
         const username = `${userDriver.lastName} ${userDriver.firstName}`;
        const targetScreen = 'Notifications';
        const title = '🚨🚨🚨  Commande Signalee 🚨🚨🚨';
        const messageBody = `🚨🚨👤 ${username} vient de signaler une commande.\n\n📞 Client : ${userClient.lastName} ${userClient.firstName}\n📱 Order ID : ${orderId}\n\nPrenez les mesures nécessaires. Prix total : ${order.total_price} €`;

        // Envoi de la notification
        await notificationController.sendNotificationAdmin(username, targetScreen, messageBody, title);
        }
        const { io } = require('../index');
        io.to(userClient.deviceId).emit('orderStatusUpdates', { order });

        await orderController.watchOrders(io) ;
        return res.json({ message: "success", order: { _id: order._id, status: order.status, active: order.active } });

    } catch (error) {
        console.error("Error during processing order delivery:", error);
        return res.status(500).json({ message: "error", errors: ["Failed to process order delivery"] });
    }
};

  exports.getAvailableDrivers = async (req, res) => {
    try {
      // Find all drivers where isDisponible is true and populate the user details
      const drivers = await Driver.find({ isDisponible: true,isPause: false })
        .populate({
          path: 'user_id',
          model: 'User',
          select: 'firstName lastName userType'
        });
  
      // Map to include both user details and driver details
      const response = drivers.map(driver => ({
        driver_id: driver._id,
        user_id: driver.user_id._id,
        firstName: driver.user_id.firstName,
        lastName: driver.user_id.lastName,
        userType: driver.user_id.userType,
        isDisponible: driver.isDisponible,
      }));
  console.log('------------------------------------');
  console.log("response",response);
  console.log('------------------------------------');
      // Return the list of available drivers
      res.status(200).json(response);
    } catch (error) {
      console.error('Error retrieving available drivers:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  };


  exports.getAvailableDriversForChart = async (req, res) => {
    try {
      // Find all drivers where isDisponible is true and populate the user details
      const drivers = await Driver.find()
        .populate({
          path: 'user_id',
          model: 'User',
          select: 'firstName lastName userType'
        });
  
      // Map to include both user details and driver details
      const response = drivers.map(driver => ({
        driver_id: driver._id,
        user_id: driver.user_id._id,
        firstName: driver.user_id.firstName,
        lastName: driver.user_id.lastName,
        userType: driver.user_id.userType,
        isDisponible: driver.isDisponible,
      }));
  console.log('------------------------------------');
  console.log("response",response);
  console.log('------------------------------------');
      // Return the list of available drivers
      res.status(200).json(response);
    } catch (error) {
      console.error('Error retrieving available drivers:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  };





// Controller function
exports.getDriverRevenueAndOrders = async (req, res) => {
  const { driverId, startDate, endDate } = req.body;

  try {
    // Validate input
    if (!driverId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide driverId, startDate, and endDate.' });
    }

    // Convert startDate and endDate to Date objects if needed
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Query to get delivered orders between the dates for the driver
    const deliveredOrders = await Order.find({
      driver_id: driverId,
      status: 'delivered',
      created_at: { $gte: start, $lte: end }
    });

    // Calculate total revenue
    const totalRevenue = deliveredOrders.reduce((acc, order) => acc + order.total_price, 0);

    // Return the total revenue and count of delivered orders
    res.status(200).json({
      totalRevenue,
      totalDeliveredOrders: deliveredOrders.length
    });

  } catch (error) {
    console.error('Error fetching driver revenue and orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};