const Driver = require('../models/Driver');
const User = require('../models/User');
const Order = require('../models/Order');
const Client = require('../models/Client');
const notificationController  =require('./notificationController');
const orderController  =require('./orderController');
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
            { status: "delivered",active: false,drivercomment:comment },
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
       
        return res.json({ message: "success", order: { _id: order._id, status: order.status, active: order.active } });

    } catch (error) {
        console.error("Error during processing order delivery:", error);
        return res.status(500).json({ message: "error", errors: ["Failed to process order delivery"] });
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
    








        return res.json({ message: "success", user: { userId: user._id, isLogin: false } });
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ message: "error", errors: ["Failed to log out user"] });
    }
};



  exports.commandeCanceled = async (req, res) => {
    try {
        const { order_number,reportReason, comment  } = req.body;  // C'est en fait l'orderId, renommez-le pour être plus explicite
        const orderId = order_number;
console.log('------------------------------------');
console.log('orderId to canceled...:', orderId);
console.log('orderId to canceled...:', reportReason);
console.log('orderId to canceled...:', comment);
console.log('------------------------------------');
        // Trouver la commande par son _id et mettre à jour son statut à "delivered"
        const order = await Order.findOneAndUpdate(
            { _id: orderId },
            { status: "cancelled",active: false ,report_reason: reportReason,report_comment: comment },
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
        const { io } = require('../index');
        io.to(userClient.deviceId).emit('orderStatusUpdates', { order });
       
        return res.json({ message: "success", order: { _id: order._id, status: order.status, active: order.active } });

    } catch (error) {
        console.error("Error during processing order delivery:", error);
        return res.status(500).json({ message: "error", errors: ["Failed to process order delivery"] });
    }
};

  exports.getAvailableDrivers = async (req, res) => {
    try {
      // Find all drivers where isDisponible is true and populate the user details
      const drivers = await Driver.find({ isDisponible: true })
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