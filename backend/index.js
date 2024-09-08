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
const Order = require('./models/Order'); // Your Order model
const Product = require('./models/Product');
const user = require('./models/User');
const Client = require('./models/Client');
const Driver = require('./models/Driver');
const OrderItem = require('./models/OrderItem');
const chatRoutes = require('./routes/chatRoutes');
const cors = require('cors');
const fetchPendingOrders  = require('./controllers/orderController.js');


// Initialize express and create HTTP server
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {

        origin: 'http:// 192.168.8.113:4000',
        methods: ["GET", "POST"],
    },
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
const driver = require('./models/Driver');
const { handleChatInitiation, handleSendMessage, watchMessages } = require('./controllers/ChatSupportController.js');
const { handleSendMessageCD, handleChatInitiationDC } = require('./controllers/chatController.js');


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


  
// WebSocket connection
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('driverConnected', async (driverId) => {
        try {
          // Find the driver's associated orders
          const order = await Order.findOne({ driver_id: driverId, active: true });
    
          if (order) {
            console.log(`Order found for driver ${driverId}:`, order);
    
            // Emit the order details back to the driver, including its active status
            socket.emit('orderDetails', {
              orderId: order._id,
              active: order.active,
              driverId: order.driver_id,
            });
    
            // Set up a change stream to watch changes to this specific order
            const orderChangeStream = Order.watch([{ $match: { 'documentKey._id': order._id } }]);
    
            orderChangeStream.on('change', (change) => {
              if (change.updateDescription && 'active' in change.updateDescription.updatedFields) {
                const updatedFields = change.updateDescription.updatedFields;
                console.log(`Order ${order._id} updated. Active status: ${updatedFields.active}`);
                
                // Emit the updated status to the connected driver
                io.emit('orderActiveChanged', {
                  orderId: order._id,
                  driverId: updatedFields.driver_id,
                  active: updatedFields.active,
                });
              }
            });
          } else {
            console.log(`No active order found for driver ${driverId}`);
          }
        } catch (error) {
          console.error('Error finding order for driver:', error);
        }
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
    socket.on('disconnect', async () => {
      try {
        // Optionally, update the driver's `isConnected` status to false upon disconnect
        const user = await User.findOne({ deviceId: socket.handshake.query.deviceId });
        if (user) {
          const driver = await Driver.findOne({ user_id: user._id });
          if (driver) {
            driver.location.isConnected = false;
            await driver.save();
    
            io.emit('locationUpdateForAdmin', {
              driverId: user.deviceId,
              latitude: driver.location.latitude,
              longitude: driver.location.longitude,
              isConnected: driver.location.isConnected
            });
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });



    
    socket.on('locationUpdateForAdminRequest', async (deviceId1) => {
      try {
       await warnController.d
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
                socket.emit('loginFailure', { message: 'Device ID not provided' });
                return;
            }
    
            loginController.autoLogin(socket, data); 
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

    socket.on('addNotification', async (data) => {
        try {
            const notification = await notificationController.sendNotification(data, io);
            io.emit('newNotification', notification); // Envoie la nouvelle notification à tous les clients connectés
        } catch (error) {
            console.error('Error adding notification:', error);
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
     await this.fetchPendingOrders(io) ;

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
        await fetchPendingOrders(socket);
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
socket.on('sendMessage', async ({ chatId, sender, content }) => {
 await handleSendMessage({ chatId, sender, content, io }) ;
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

 

 User.find({ userType: 'Driver' }).then((drivers) => {
  socket.emit('driversUpdated', { drivers });
});


User.find({ userType: 'Client' }).then((clients) => {
  socket.emit('clientsUpdated', { clients });
});

  socket.on('getPendingOrders', async () => {
     await fetchPendingOrders(socket);
  });


  socket.on('getCancelledOrders', async () => {
    await orderController.fetchCancelledgOrders(socket);
 });

 socket.on('getDeliveredOrders', async () => {
  await orderController.fetchDilevredOrders(socket);
 });


socket.on('watchChatMessages', async () => {
  await  watchMessages({socket}) ;
});

});
  

// Routes
app.use('/api/addresses', addressRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/clients', clientRoutes);

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
