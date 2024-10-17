const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
require('dotenv').config();
const Service = require('./models/Service');
const Warn = require('./models/Warn');
const QrCode = require('./models/QrCode');
const User = require('./models/User'); // Make sure to require your User model
const clientController = require('./controllers/ClientController');
const notificationController = require('./controllers/notificationController');
const loginController = require('./controllers/LoginController');
const orderController = require('./controllers/orderController');
const serviceRoutes = require('./routes/serviceRoutes');
const userController = require('./controllers/UserController');
const ProductController = require('./controllers/productController');
const adminController = require('./controllers/adminController');
const warnController = require('./controllers/warnController');
const addressRoutes = require('./routes/addressRoute');
const adminRoutes = require('./routes/adminRoutes');
const clientRoutes = require('./routes/clientRoutes');
const driverRoutes = require('./routes/driverRoutes');
const cartRoute = require('./routes/cartRoute');
const orderRoute = require('./routes/orderRoute');
const chatRoute = require('./routes/chatRoute');
const ChatSupport = require('./models/ChatSupport');
const Chat = require('./models/Chat');
const qrCodeRoutes = require('./routes/qrCodeRoutes');
const orderHistoryRoutes = require('./routes/orderHistoryRoutes');
const orderItemRoutes = require('./routes/orderItemRoutesr');
const productRoutes = require('./routes/productRoutes');
const profileRoutes = require('./routes/ProfileRoute');
const referralRoutes = require('./routes/referralRoutes');
const notificationRoute = require('./routes/notificationRoute.js');
const sessionRoutes = require('./routes/sessionRoutes');
const userRoutes = require('./routes/userRoutes');
const Order = require('./models/Order.js'); // Your Order model
const Product = require('./models/Product');
const user = require('./models/User');
const Client = require('./models/Client');
const Driver = require('./models/Driver');
const OrderItem = require('./models/OrderItem');
const chatRoutes = require('./routes/chatRoutes');
const cors = require('cors');
const Address = require('./models/Address');

const {
  emitInitialStatus,
  toggleSystemStatus,
  toggleClientsStatus,
  toggleDriversStatus,
  toggleSystemStatusForDriver,
} = require('./controllers/socketController');
// Initialize express and create HTTP server
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {

        origin: 'http://192.168.8.159:4000',
        methods: ["GET", "POST"],
    },
    pingTimeout: 60000, // Disconnect if no pong in 60 seconds
    pingInterval: 25000 // Ping every 25 seconds
});

// Middleware
app.use(bodyParser.json());

// Middleware to attach io to req
app.use((req, res, next) => {
    req.io = io;
    next();
});


mongoose.set("strictQuery", true);
mongoose.connect('mongodb+srv://saadi0mehdi:1cmu7lEhWPTW1vGk@cluster0.whkh7vj.mongodb.net/ExpressApp?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});


const cron = require('node-cron');
const { handleChatInitiation, handleSendMessage, watchMessages, watchSupportMessagesForDriver } = require('./controllers/ChatSupportController.js');
const { getRouteDetails } = require('./controllers/LocationRouteController.js');
const { assignPendingOrders } = require('./controllers/orderController.js');

const { handleSendMessageCD, handleChatInitiationDC, watchOrderMessages, joinOrderMessage, watchOrderMessagesForDriver } = require('./controllers/chatController.js');


// Tâche planifiée pour supprimer les QR codes expirés et non utilisés tous les jours à 2h du matin
cron.schedule('0 2 * * *', async () => {
  try {
    const now = Date.now();
    
    // Supprimer les QR codes qui sont expirés et non utilisés
    const result = await QrCode.deleteMany({ expirationTime: { $lt: now }, isUsed: false });
    
    console.log(`QR codes expirés et non utilisés supprimés: ${result.deletedCount}`);
  } catch (error) {
    console.error('Erreur lors de la suppression des QR codes expirés:', error);
  }
});
cron.schedule('0 * * * *', async () => {
  console.log('Vérification des commandes en attente...');
  await assignPendingOrders();
});

// Function to calculate distance and duration
let drivers = {}; // Store connected drivers and their statuses

let notificationSent = false; // Variable pour suivre l'envoi de la notification

  
// WebSocket connection
io.on('connection', (socket) => {
  const deviceId = socket.handshake.query.deviceId;
  socket.join(deviceId);


    console.log('A user connected',deviceId);
    drivers[deviceId] = { socketId: socket.id, status: 'online', lastPing: new Date() };

    // Emit the connection status to the driver (if needed)
    socket.emit('connectionStatus', { status: 'connected', deviceId });

 // When the driver pings the server
 socket.on('driverPing', (data) => {
  console.log(`Received ping from driver: ${data.deviceId}`);
  updateDriverPing(data.deviceId); // Update the last ping timestamp
});



socket.on('joinRouteTracking', async (orderId) => {
  try {
    console.log("request duration for order id", orderId);

    // Envoie les détails initiaux de l'itinéraire
    const routeDetails = await getRouteDetails(orderId);
    console.log(routeDetails);
    const order1 = await Order.findById(orderId);

    const client1 = await Client.findById(order1.client_id);

    const userClient1 = await User.findById(client1.user_id);

         io.to(userClient1.deviceId).emit('routeUpdate', routeDetails);


    const interval1 = setInterval(async () => {
      const updatedRouteDetails = await getRouteDetails(orderId);
    const order = await Order.findById(orderId);

    if (order.status !== 'in_progress') {
      clearInterval(interval1);  // Arrêtez l'intervalle si la commande n'est plus 'in_progress'
      console.log('Order is no longer in progress, stopping route updates');
      return;
    }
      const driver = await Driver.findById(order.driver_id);
      const client = await Client.findById(order.client_id);
      const userClient = await User.findById(client.user_id);
      const userDriver = await User.findById(driver.user_id);


      io.to(userClient.deviceId).emit('routeUpdate', updatedRouteDetails);
console.log("interval routes")
  

      const duration = updatedRouteDetails.duration; // Durée restante

      // Vérifiez si la durée est inférieure à 2 minutes (120 secondes)
      if ((Math.floor(duration / 60)) < 2 && !notificationSent) {
        const name = "Mise à jour de l'itinéraire"; // Personnalisez le nom
        const message = `Votre commande arrive bientôt ! Temps restant : ${Math.floor(duration / 60)}min.`; // Message personnalisé
        const title = "Attention !"; // Titre de la notification
        const userType = "Client"; // Type d'utilisateur (client)

        await notificationController.sendNotificationForce(name, userClient.pushToken, message, title, userType);
        notificationSent = true; // Marque que la notification a été envoyée
      }

    }, 30000);

    // Nettoyage lors de la déconnexion
    socket.on('disconnectRoute', () => {
      clearInterval(interval1);
      notificationSent = false; 
      console.log('Client disconnected');
    });
  } catch (error) {
    socket.emit('error', 'Error fetching route details');
  }
});






// If driver explicitly disconnects
socket.on('driverDisconnected', (data) => {
  console.log(`Driver lost internet connection: ${data.deviceId}`);
  if (drivers[data.deviceId]) {
    drivers[data.deviceId].status = 'disconnected';
  }
});
socket.on('reconnect', () => {
  console.log(`Driver reconnected: ${deviceId}`);
  if (drivers[deviceId]) {
    drivers[deviceId].status = 'online';
  }
});

    socket.on('driverConnected', async (deviceId) => {
        try {
          // Find the driver's associated orders
          await orderController.fetchInProgressOrdersForDriver(io, deviceId);
        

        } catch (error) {
          console.error('Error finding order for driver:', error);
        }
      });
      socket.on('toggleSystemDriver', () => {
        console.log('Toggling system status for driver:');
        console.log('Toggling system status for driver:');
        console.log('Toggling system status for driver:');
        toggleSystemStatusForDriver(io);
      }); 
      // Handle system toggle
      socket.on('toggleSystem', (data) => {
        toggleSystemStatus(data, io);
      }); 

   
      socket.on('statusS', (data) => {
        emitInitialStatus(socket);
      });
    
      // Handle clients toggle
      socket.on('toggleClients', (data) => {
        toggleClientsStatus(data, io);
      });
    
      // Handle drivers toggle
      socket.on('toggleDrivers', (data) => {
        toggleDriversStatus(data, io);
      });

    socket.on('registerClient', async (data) => {
        console.log('Register client data:', data);
    
        const req = { body: data, io: io }; // Objet req simulé
        const res = {

            status: (statusCode) => ({
                json: (responseData) => {
                    console.log('Response data:', responseData);
                    // Informer le client via socket.io en fonction de la réponse du contrôleur
                    if (statusCode === 201) {
                        io.emit('clientRegistered', { message: 'success', details: responseData.details });
                    } else {
                        io.emit('clientRegistered', { message: 'error', details: responseData.errors.join(', ') });
                    }
                }
            })
        };
    
        try {
            await clientController.saveClient(req, res);
        } catch (error) {
            console.error('Error registering client:', error);
            io.emit('clientRegistered', { message: 'error', details: 'Error registering client' });
        }
    });
    

    socket.on('registerClientLC', async (data) => {
        console.log('Register client data:', data);
    
        const req = { body: data, io: io }; // Objet req simulé
       
    
        try {
            await clientController.saveClientLC(req, data);
        } catch (error) {
            console.error('Error registering client:', error);
            io.emit('clientRegisteredLC', { message: 'error', details: 'Error registering client' });
        }
    });


    socket.on('productAdded',  async () => { 

      const products = await Product.find({ is_active: true } );
      socket.emit('activeProducts', products); // Emit current active products
  

    });



    socket.on('driverLocationUpdate', async ({ deviceId, latitude, longitude }) => {
      try {
        console.log('Driver location update received:', { deviceId, latitude, longitude });

        // Find the user associated with the deviceId
        const user = await User.findOne({ deviceId: deviceId });
        if (!user) {
          console.log('User not found for deviceId:', deviceId);
          return;
        }
    
        // Find the driver based on the user_id
        const driver = await Driver.findOne({ user_id: user._id });
        if (!driver) {
          console.log('Driver not found for user_id:', user._id);
          return;
        }
    
        // Update the driver's location and set isConnected to true
        driver.location = {
          latitude: latitude,
          longitude: longitude,
          isConnected: true
        };
        
        // Save the updated driver information
        await driver.save();
    
        // Emit the updated location to the admin app
      
      } catch (error) {
        console.error('Error updating driver location:', error);
      }
    });
    
    // Handle driver disconnects
    socket.on('disconne00ct', async () => {
      try {
        // Optionally, update the driver's `isConnected` status to false upon disconnect
        const user = await User.findOne({ deviceId: socket.handshake.query.deviceId });
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












      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });



    
    socket.on('locationUpdateForAdminRequest', async (deviceId1) => {
      try {
       await adminController.locationUpdateForAdminRequest(socket, { deviceId1 });
      } catch (error) {
        console.error('Error fetching driver location:', error);
      }
    });
    


    socket.on('getUserByClientId', async ({ clientId }) => {
        console.log('---------WA L3ADAAAAAAAAAAAAAW---------------------------');
        console.log('Client ID:', clientId);
        console.log('------------------------------------');
       const user= await clientController.getUserByClientId( { clientId });
       if (user) {
        socket.emit('userByClientId', {user});
       }
    });



    socket.on('checkActivation', async ({ deviceId }) => {
        await loginController.checkUserActivation(socket, { deviceId });
    });

    socket.on('requestActiveProducts',async (serviceName) => {
        
       await ProductController.sendActiveProducts(socket,serviceName);
    });

    socket.on('autoLogin', async (data) => {
        try {
            const { deviceId } = data;
    console.log('Auto login data:', data);
            // Vérification si l'ID de l'appareil est fourni
            if (!deviceId) {
                io.to(deviceId).emit('loginFailure', { message: 'Device ID not provided' });

                return;
            }
    
            loginController.autoLogin(socket, data,io); 
            // Si tout va bien, l'utilisateur est connecté
           
    
        } catch (error) {
            console.error('Error during auto login:', error);
            socket.emit('loginFailure', { message: 'An error occurred during login' });
        }
    });
       socket.on('autoLoginDriver', async (data) => {
        try {
            const { deviceId } = data;
    console.log('Auto login data:', data);
            // Vérification si l'ID de l'appareil est fourni
            if (!deviceId) {
                socket.emit('loginFailure', { message: 'Device ID not provided' });
                return;
            }
    
            loginController.autoLoginDriver(socket, data); 
            // Si tout va bien, l'utilisateur est connecté
           
    
        } catch (error) {
            console.error('Error during auto login:', error);
            socket.emit('loginFailure', { message: 'An error occurred during login' });
        }
    });
    
    
    socket.on('adminAutoLogin', async (data) => {
        try {
            const { deviceId } = data;
    console.log('Auto login data:', data);
            // Vérification si l'ID de l'appareil est fourni
            if (!deviceId) {
                socket.emit('loginFailure', { message: 'Device ID not provided' });
                return;
            }
    
            adminController.adminAutoLogin(socket, data); 
            // Si tout va bien, l'utilisateur est connecté
          
    
        } catch (error) {
            console.error('Error during auto login:', error);
            socket.emit('loginFailure', { message: 'An error occurred during login' });
        }
    }); 
    
    
    
    socket.on('adminRestoreLogin', async (data) => {
        try {
            const { deviceId } = data;
    console.log('Auto login data:', data);
            // Vérification si l'ID de l'appareil est fourni
            if (!deviceId) {
                socket.emit('restoreFailure', { message: 'Device ID not provided' });
                return;
            }
    
            adminController.adminRestoreLogin(socket, data); 
            // Si tout va bien, l'utilisateur est connecté
            socket.emit('adminRestoreSuccess', { userId: user._id, message: 'Login data via email successful' });
    
        } catch (error) {
            console.error('Error during auto login:', error);
            socket.emit('restoreFailure', { message: 'An error occurred during login' });
        }
    });
    
  
    socket.on('requestNotifications', async (deviceId) => {
        try {
          const notifications = await notificationController.getNotifications(deviceId);
          socket.emit('allNotifications', notifications);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      });








socket.on('sendNotification', async (data) => {
  const { users, title, message } = data;

  // Boucle pour chaque utilisateur sélectionné
  for (const user of users) {
    const { name, pushToken, userType } = user;
    await notificationController.sendNotificationForce(name, pushToken, message, title, userType);

  }
});



// Join the room based on deviceId



socket.on('adminActivateDeactivateClient', async ({ clientId, isActive ,deviceId}) => {

  await userController.activateDeactivateClient(io,clientId, isActive,deviceId);
});
socket.on('adminToggleLoginStatus', async ({ clientId,deviceId}) => {

  await userController.toggleLoginStatus(io,clientId,deviceId);
});


socket.on('adminActivateDeactivateDriver', async ({ driverId, isActive, deviceId }) => {

    await userController.activateDeactivateDriver(io, driverId, isActive, deviceId);
  });

  // Admin toggles the login status of a driver
  socket.on('adminToggleDriverLoginStatus', async ({ driverId }) => {
    await userController.toggleLoginStatusD(io, driverId);});


 

















     socket.on('getRouteDetails', async (orderId) => {
        try {
            const result = await getRouteDetails(orderId);
            socket.emit('routeDetails', result);
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });






 














    socket.on('markAsRead', async (notificationId) => {
        try {
            const updatedNotification = await notificationController.markAsRead(notificationId);
            socket.emit('notificationRead', updatedNotification); // Émet l'état mis à jour au client
        } catch (error) {
            console.error('Error marking notification as read:', error.message);
        }
    });

   // Quand un utilisateur demande ses commandes en fonction de son deviceId
   socket.on('requestOrders', async (deviceId) => {
    try {
      const orders = await orderController.getOrdersByDeviceId(deviceId);
      console.log(orders)
      socket.emit('allOrders', orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  });
  
  // Quand une nouvelle commande est ajoutée
  socket.on('addOrder', async (orderData) => {
    console.log(orderData)
    console.log('------------------------------------');
    console.log("000000000000000000000000000000000000000000000000000");
    console.log('------------------------------------');
    try {
     

     const order = await orderController.addOrder(orderData, io);
  
      // Afficher l'ordre dans la console
      console.log('----------////////////////////////////--------------------------');
      console.log(orderData);
      console.log('-----------/////////////////////////////-------------------------');
  
      // Émettre l'événement 'orderAdded' pour informer le frontend que l'ordre a été ajouté
     socket.emit('orderAdded', order);
     await orderController.fetchPendingOrders(io) ;
    await orderController.assignPendingOrders();

    } catch (error) {
      // Gestion des erreurs
      console.error('Error adding new order:', error);
    }
  });
  socket.on('checkOrderStatus', async ({ order_id }) => {
    try {
        console.log("ghhhhhhhhhhhhhhhhhhhkkkkkkkkkkkkkkkkkkkkkkh")
        console.log(order_id)

      const order =await orderController.checkOrderStatus(order_id);
      if (order) {
        socket.emit('orderStatusUpdate', {order});
        await orderController.fetchPendingOrders(socket);
        console.log('Order status updated:', order);
      }
    } catch (error) {
      console.error('Error checking order status:', error);
    }
  });

  
// Chat initiation for client and admin
// Assuming you've already set up your socket.io server
socket.on('initiateChat', async ({ adminId, userId, userType }) => {
  await handleChatInitiation({ adminId, userId, userType, socket }); 
});

// Handle message sending (for both client and admin)
socket.on('sendMessage', async ({ chatId, sender, content ,deviceId }) => {
 await handleSendMessage({ chatId, sender, content , deviceId, io }) ;
});


  // Handle message sending
  socket.on('initiateChats', async ({ orderId, clientId, driverId }) => {
    await handleChatInitiationDC({ orderId, clientId, driverId , socket }); 

  });

  // Handle message sending
  socket.on('sendMessages', async ({ chatId, sender, content }) => {
   await handleSendMessageCD({ chatId, sender, content, io }) ;
  });


  socket.on('watchOrderStatuss', async ({ order_id }) => {
    socket.join(order_id);
   await orderController.OnOrderStatusUpdated({order_id , io})
   await orderController.assignPendingOrders();

  });



  Service.find().then((services) => {
    socket.emit('servicesUpdated', { services });
  });


  Product.find().then((products) => {
    socket.emit('productsUpdated', { products });
  });

  
 socket.on('requestAllWarns', async () => {
       try {
        const warns = await Warn.find(); // Ou utilisez getAllWarns sans `res`
        socket.emit('warnsData', warns); // Envoyer les données récupérées au client spécifique
      } catch (error) {
        console.error('Error fetching warns on socket connection:', error);
      }
  });





  socket.on('requestUsersAndDrivers', async () => {
    try {
      userController.getAllUsersAndDriversForAdmin(socket);
    } catch (error) {
      socket.emit('error', 'Erreur lors de la récupération des utilisateurs');
    }
  });

 User.find({ userType: 'Driver' }).then((drivers) => {
  socket.emit('driversUpdated', { drivers });
});



User.find({ userType: 'Client' }).then((clients) => {
  socket.emit('clientsUpdated', { clients });
});

  socket.on('getPendingOrders', async () => {
     await orderController.fetchPendingOrders(socket);
  });


  socket.on('getCancelledOrders', async () => {
    await orderController.fetchCancelledgOrders(socket);
 });

 socket.on('getDeliveredOrders', async () => {
  await orderController.fetchDilevredOrders(socket);
 });


 socket.on('getTestOrders', async () => {
  await orderController.fetchTestOrders(socket);
 });


 socket.on('fetchDriverOrdersForCountUpdated', async () => {
  await orderController.fetchDriverOrdersForCount(socket);
 });


 socket.on('getInProgressOrders', async () => {
  await orderController.fetchInProgressOrders(socket);
 });



socket.on('watchChatMessages', async () => {
  await  watchMessages({socket}) ;
});

socket.on('watchChatMessagesDriver', async (deviceId) => {
  await  watchOrderMessagesForDriver({socket , deviceId}) ;
});


socket.on('watchSupportChatMessagesDriver', async (deviceId) => {
  await  watchSupportMessagesForDriver({socket , deviceId}) ;
});

socket.on('watchOrderChatMessages', async () => {
  await  watchOrderMessages({socket }) ;
});

// Client joins an existing chat room with a specific chatId
socket.on('joinExistingChat', async ({ chatId }) => {
    await joinOrderMessage({socket , chatId}) ;
});



socket.on('getDeliveredOrdersSummary', async () => {
  try {
    // Fetch delivered orders from the database
    const deliveredOrders = await Order.find({ status: 'delivered' });

    // Log the delivered orders for debugging
    console.log('Delivered Orders:', deliveredOrders);

    // If there are no delivered orders, totalSum will be 0
    if (!Array.isArray(deliveredOrders) || deliveredOrders.length === 0) {
      console.log('No delivered orders found.');
      socket.emit('deliveredOrdersSummary', {
        totalSum: 0,
        totalCount: 0
      });
      return;
    }

    // Calculate total sum of delivered orders
    const totalSum = deliveredOrders.reduce((acc, order) => {
      // Check if total_price exists and is a valid number
      const price = typeof order.total_price === 'number' ? order.total_price : 0;
      return acc + price;
    }, 0);

    const totalCount = deliveredOrders.length;

    // Log the calculated totalSum and totalCount for debugging
    console.log('Total Sum:', totalSum);
    console.log('Total Count:', totalCount);

    // Emit the result back to the client
    socket.emit('deliveredOrdersSummary', {
      totalSum,
      totalCount
    });

  } catch (error) {
    // Handle any errors during fetching or processing
    console.error('Error fetching or processing delivered orders:', error);
    socket.emit('error', 'Could not retrieve delivered orders');
  }
});



socket.on('getTotalClients', async () => {
  try {
    const totalClients = await User.countDocuments({ userType: 'Client' });
    // Emit the result back to the client
    socket.emit('totalClients', { totalClients });
  } catch (error) {
    console.error('Error fetching total clients:', error);
    socket.emit('error', 'Could not retrieve total clients');
  }
});



socket.on('getTotalProducts', async () => {
  try {
    const totalProducts = await Product.countDocuments({ is_active: true }); // Count only active products
    // Emit the result back to the client
    socket.emit('totalProducts', { totalProducts });
  } catch (error) {
    console.error('Error fetching total products:', error);
    socket.emit('error', 'Could not retrieve total products');
  }
});




socket.on('getDailyRevenue', async () => {
  try {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 365); // 1 year back

    // Aggregate the total revenue for each day
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          created_at: {
            $gte: startDate,
            $lte: today,
          },
          status: 'delivered', // Assuming you want only delivered orders
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          totalRevenue: { $sum: "$total_price" },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date ascending
      },
    ]);

    // Emit the result back to the client
    socket.emit('dailyRevenue', { dailyRevenue });
  } catch (error) {
    console.error('Error fetching daily revenue:', error);
    socket.emit('error', 'Could not retrieve daily revenue');
  }
});



socket.on('getDailyRevenueDriver', async (driverId) => {
  try {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 365); // 1 year back

    // Aggregate the total revenue for each day for the specified driver
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          created_at: {
            $gte: startDate,
            $lte: today,
          },
          status: 'delivered', // Assuming you want only delivered orders
          driver_id: mongoose.Types.ObjectId(driverId), // Filter by the given driverId
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          totalRevenue: { $sum: "$total_price" },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date ascending
      },
    ]);

    // Emit the result back to the client
    socket.emit('dailyRevenueDriver', { dailyRevenue });
  } catch (error) {
    console.error('Error fetching daily revenue:', error);
    socket.emit('error', 'Could not retrieve daily revenue');
  }
});



socket.on('getDriverStats', async () => {
  try {
    const driverStats = await Driver.aggregate([
      {
        // Join with User collection
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        // Unwind the joined user array (since it is a single user, not an array)
        $unwind: '$userInfo'
      },
      {
        // Join with Order collection
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'driver_id',
          as: 'orders'
        }
      },
      {
        // Add fields to calculate number of delivered orders and total revenue
        $addFields: {
          deliveredOrders: {
            $size: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: { $eq: ['$$order.status', 'delivered'] }
              }
            }
          },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$orders',
                    as: 'order',
                    cond: { $eq: ['$$order.status', 'delivered'] }
                  }
                },
                as: 'deliveredOrder',
                in: '$$deliveredOrder.total_price'
              }
            }
          }
        }
      },
      {
        // Project the required fields
        $project: {
          _id: 0, // Hide the default MongoDB _id
          driverId: '$_id',
          userId: '$userInfo._id',
          firstName: '$userInfo.firstName',
          lastName: '$userInfo.lastName',
          deliveredOrders: 1,
          totalRevenue: 1
        }
      }
    ]);
     

    socket.emit('driverStats', driverStats);
  } catch (err) {
    console.error('Error fetching driver stats:', err);
    socket.emit('error', 'Error fetching driver stats');
  }
});


const getProductsRevenueAndCount = async () => {
  try {
    // Step 1: Aggregate data from OrderItem to calculate revenue and total times bought for each product
    const orderItems = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders', // The collection name for 'Order' should be 'orders' in MongoDB
          localField: 'Order_id',
          foreignField: '_id',
          as: 'orderDetails'
        }
      },
      {
        $unwind: '$orderDetails' // Unwind the order details array
      },
      {
        $match: { 'orderDetails.status': 'delivered' } // Only include delivered orders
      },
      {
        $group: {
          _id: "$product_id",
          totalTimesBought: { $sum: "$quantity" }, // Sum of quantities for each product
          totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } }, // Sum of revenue (price * quantity)
        }
      }
    ]);

    // Step 2: Fetch all products
    const allProducts = await Product.find();

    // Step 3: Combine the data, setting revenue and total times bought to 0 for products that have not been bought
    const productsWithStats = allProducts.map(product => {
      const stats = orderItems.find(item => item._id.toString() === product._id.toString());
      return {
        product,
        totalTimesBought: stats ? stats.totalTimesBought : 0,
        totalRevenue: stats ? stats.totalRevenue : 0
      };
    });

    return productsWithStats;
  } catch (error) {
    console.error('Error fetching products revenue and count:', error);
    throw error;
  }
};


// Socket.io implementation


  // Listen for the frontend event to get product data
  socket.on('getProductsRevenue', async () => {
    try {
      const productsWithStats = await getProductsRevenueAndCount();
      // Emit the product data back to the frontend
      socket.emit('productsRevenue', productsWithStats);
    } catch (error) {
      socket.emit('error', { message: 'Error fetching products data' });
    }
  });


});
  
const checkDriverStatus = async () => {
  console.log('------------------------------------');
  console.log("check");
  console.log('------------------------------------');
  const now = new Date();
  Object.keys(drivers).forEach(async (deviceId) => {
    const driver = drivers[deviceId];
    const lastPing = driver.lastPing;
    const diffInMinutes = (now - new Date(lastPing)) / 1000 / 60;

    // Vérifie si le livreur est inactif depuis plus de 1 minute
    if (diffInMinutes > 3 && driver.status === 'online') {
      console.log(`Marquage du livreur ${deviceId} comme déconnecté en raison d'une inactivité.`);
      
      // Mettre à jour le statut du livreur dans l'objet drivers
      driver.status = 'disconnected';

      // Mettre à jour le statut du livreur dans la base de données
      try {
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
  












      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
      
    }
  });
};

// Exemple de fonction pour mettre à jour le ping du livreur
const updateDriverPing = (deviceId) => {
  const now = new Date();
  if (!drivers[deviceId]) {
    drivers[deviceId] = { lastPing: now, status: 'online' };
  } else {
    drivers[deviceId].lastPing = now;
    drivers[deviceId].status = 'online';
  }
};

// Fonction pour démarrer la vérification des statuts toutes les 30 secondes
setInterval(checkDriverStatus, 40 * 1000); // Vérifie toutes les 30 secondes

// Routes
app.use('/api/addresses', addressRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/chat', chatRoute);

app.use('/api/driver', driverRoutes);

app.use('/api/order-history', orderHistoryRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/products', productRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/carts', cartRoute);
app.use('/api/orders', orderRoute);
app.use('/api/driverChat', chatRoute);
app.use('/api/services', serviceRoutes);
app.use('/api/qr-codes', qrCodeRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/notification', notificationRoute);


// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
module.exports = { io, server  };
