const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
require('dotenv').config();
const Service = require('./models/Service');
const Warn = require('./models/Warn');
const QrCode = require('./models/QrCode');







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
      }
    } catch (error) {
      console.error('Error checking order status:', error);
    }
  });


// Chat initiation for client and admin
// Assuming you've already set up your socket.io server
socket.on('initiateChat', async ({ adminId, userId, userType }) => {
  console.log(adminId, userId, userType);
  try {
      let chat = null;

      if (userType === 'Admin') {
          // First, try to find the user in the Client collection
          const client = await Client.findOne({ user_id: userId });
          console.log(client);

          if (client) {
              // If found in Client, check for existing chat between admin and client
              chat = await ChatSupport.findOne({ admin_id: adminId, client_id: client._id });
              if (!chat) {
                  // If no chat exists, create a new one
                  chat = new ChatSupport({
                      admin_id: adminId,
                      client_id: client._id,
                      messages: []
                  });
                  await chat.save();
              }
          } else {
              // If not found in Client, try to find the user in the Driver collection
              const driver = await Driver.findOne({ user_id: userId });

              if (driver) {
                  // If found in Driver, check for existing chat between admin and driver
                  chat = await ChatSupport.findOne({ admin_id: adminId, client_id: driver._id }); // Assuming client_id is used for drivers too
                  if (!chat) {
                      // If no chat exists, create a new one
                      chat = new ChatSupport({
                          admin_id: adminId,
                          client_id: driver._id, // Storing driver._id in client_id for simplicity
                          messages: []
                      });
                      await chat.save();
                  }
              } else {
                  // If not found in both collections, throw an error
                  throw new Error('User not found in Client or Driver collections');
              }
          }
      } else {
          // For non-admin users, find the chat as usual (assuming userId is always the clientId here)
          chat = await ChatSupport.findOne({ admin_id: adminId, client_id: userId });

          if (!chat) {
              // If no chat exists, create a new one
              chat = new ChatSupport({
                  admin_id: adminId,
                  client_id: userId,
                  messages: []
              });
              await chat.save();
          }
      }

      // Join the room for this specific chat
      socket.join(chat._id.toString());

      // Emit all messages to the client/driver
      socket.emit('chatDetails', { chatId: chat._id, messages: chat.messages });
      console.log("chat.messages")

  } catch (error) {
      console.error('Error initiating chat:', error);
      socket.emit('error', { message: 'Error initiating chat: ' + error.message });
  }
});

// Handle message sending (for both client and admin)
socket.on('sendMessage', async ({ chatId, sender, content }) => {
  try {
    const chat = await ChatSupport.findById(chatId);
    if (!chat) {
      console.log(`Chat not found for chatId: ${chatId}`);
      return;
    }

    // Add the new message to the chat
    const newMessage = {
      sender,
      content,
      timestamp: new Date(),
    };
    chat.messages.push(newMessage);
    await chat.save();

    // Emit the new message to everyone in the chat room
    io.to(chatId).emit('newMessage', { message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
  }
});


  // Handle message sending
  socket.on('initiateChats', async ({ orderId, clientId, driverId }) => {
    try {
      console.log(`Received initiateChats event with orderId: ${orderId}, clientId: ${clientId}, driverId: ${driverId}`); // Debugging log

      // Check if a chat already exists for the given orderId between this driver and client
      let chat = await Chat.findOne({ order_id: orderId, client_id: clientId, driver_id: driverId });
      console.log('Chat found:', chat ? chat._id : 'No existing chat'); // Debugging log

      if (!chat) {
        // If no chat exists, create a new one
        console.log('Creating new chat for order:', orderId); // Debugging log for new chat creation

        chat = new Chat({
          order_id: orderId,
          driver_id: driverId,  // Get the driver ID from the frontend
          client_id: clientId,
          messages: []  // Initialize with an empty messages array
        });
        await chat.save();
        console.log('New chat created with ID:', chat._id); // Debugging log for saved chat
      }
      
      // Join the room for this specific chat
      socket.join(chat._id.toString());
      console.log(`Socket joined room for chatId: ${chat._id}`); // Debugging log for joining room

      // Send the existing chat details to the client
      socket.emit('chatDetailss', { chatId: chat._id, messages: chat.messages });
      console.log('Emitted chatDetailss event with messages:', chat.messages.length); // Debugging log for emitting chat details

    } catch (error) {
      console.error('Error initiating chat:', error); // Error handling log
      socket.emit('error', { message: 'Failed to initiate chat' });
    }
  });

  // Handle message sending
  socket.on('sendMessages', async ({ chatId, sender, content }) => {
    try {
      console.log(`Received sendMessages event for chatId: ${chatId}, sender: ${sender}, content: ${content}`); // Debugging log

      // Find the chat by chatId
      const chat = await Chat.findById(chatId);
      if (!chat) {
        console.log(`Chat not found for chatId: ${chatId}`); // Debugging log for missing chat
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      // Add the new message to the chat
      const newMessage = { sender, content, timestamp: new Date() };
      chat.messages.push(newMessage);
      await chat.save();
      console.log('New message added to chat:', newMessage); // Debugging log for added message

      // Emit the new message to all clients in this chat room
      io.to(chatId).emit('newMessages', { message: newMessage });
      console.log(`Emitted newMessages event for chatId: ${chatId}`); // Debugging log for emitted message

    } catch (error) {
      console.error('Error sending message:', error); // Error handling log
      socket.emit('error', { message: 'Failed to send message' });
    }
  });


  socket.on('watchOrderStatuss', async ({ order_id }) => {
    try {
      const order = await Order.findById(order_id);
      if (order) {
        // Emit the initial order status to the client
        socket.emit('orderStatusUpdates', { order });

        // Watch for changes to the order
        const orderChangeStream = Order.watch([{ $match: { 'documentKey._id': order._id } }]);
        orderChangeStream.on('change', (change) => {
          if (change.updateDescription) {
            const updatedOrder = change.updateDescription.updatedFields;
            socket.emit('orderStatusUpdates', { order: updatedOrder });
          }
        });
      }
    } catch (error) {
      console.error('Error finding or watching order:', error);
    }
  });

  socket.on('watchServicePointsStatuss', async ({ serviceID }) => {
    try {
      const service = await Service.findById(serviceID);
      if (service) {
        // Emit the initial order status to the client

        // Watch for changes to the order
        const serviceChangeStream = Service.watch([{ $match: { 'documentKey._id': service._id } }]);
        serviceChangeStream.on('change', (change) => {
          if (change.updateDescription) {
            const updatedservice = change.updateDescription.updatedFields;
            socket.emit('oserviceStatusUpdates', { service: updatedservice });
          }
        });
      }
    } catch (error) {
      console.error('Error finding or watching service:', error);
    }
  });


  Service.find().then((services) => {
    socket.emit('servicesUpdated', { services });
  });


  Product.find().then((products) => {
    socket.emit('productsUpdated', { products });
  });

  Order.find({ status: 'delivered' })
  .populate({
    path: 'client_id',
    populate: {
      path: 'user_id',
      model: 'User',
      select: 'firstName lastName'
    }
  })
  .populate({
    path: 'driver_id',
    populate: {
      path: 'user_id',
      model: 'User',
      select: 'firstName lastName'
    }
  })
  .populate({
    path: 'address_id',
    select: 'address_line'
  })
  .then(async (orders) => {
    const response = await Promise.all(orders.map(async (order) => {
      const orderItems = await OrderItem.find({ Order_id: order._id }).populate('product_id');

      return {
        order_number: order._id,
        client_name: `${order.client_id?.user_id?.firstName || 'N/A'} ${order.client_id?.user_id?.lastName || 'N/A'}`,
        driver_name: order.driver_id ? `${order.driver_id.user_id.firstName} ${order.driver_id.user_id.lastName}` : null,
        address_line: order.address_id?.address_line || 'N/A',
        products: orderItems.map(item => ({
          product: item.product_id,
          quantity: item.quantity,
          service_type: item.service_type,
          price: item.price,
          selected_options: item.selected_options
        })),
        total_price: order.total_price,
        delivery_time: order.updated_at,
        payment_method: order.payment_method,
        comment: order.comment,
        exchange: order.exchange,
        stars: order.stars,
        referral_amount: order.exchange,
        created_at: order.created_at,
        updated_at: order.updated_at,
      };
    }));



    socket.on('requestAllWarns', async () => {
      try {
        const warns = await Warn.find(); // Ou utilisez getAllWarns sans `res`
        socket.emit('warnsData', warns); // Envoyer les données récupérées au client spécifique
      } catch (error) {
        console.error('Error fetching warns on socket connection:', error);
      }
    });


















    // Emit the orders with populated details to all connected clients
    socket.emit('orderHistoryUpdated', { total: orders.length, orders: response });
  })
  .catch(err => {
    console.error('Error retrieving order history:', err.message);
  });



  Order.find({ status: 'cancelled' })
  .populate({
    path: 'client_id',
    populate: {
      path: 'user_id',
      model: 'User',
      select: 'firstName lastName'
    }
  })
  .populate({
    path: 'driver_id',
    populate: {
      path: 'user_id',
      model: 'User',
      select: 'firstName lastName'
    }
  })
  .populate({
    path: 'address_id',
    select: 'address_line'
  })
  .then(async (orders) => {
    const response = await Promise.all(orders.map(async (order) => {
      const orderItems = await OrderItem.find({ Order_id: order._id }).populate('product_id');

      return {
        order_number: order._id,
        client_name: `${order.client_id?.user_id?.firstName || 'N/A'} ${order.client_id?.user_id?.lastName || 'N/A'}`,
        driver_name: order.driver_id ? `${order.driver_id.user_id.firstName} ${order.driver_id.user_id.lastName}` : null,
        address_line: order.address_id?.address_line || 'N/A',
        products: orderItems.map(item => ({
          product: item.product_id,
          quantity: item.quantity,
          service_type: item.service_type,
          price: item.price,
          selected_options: item.selected_options
        })),
        total_price: order.total_price,
        delivery_time: order.updated_at,
        payment_method: order.payment_method,
        comment: order.comment,
        exchange: order.exchange,
        stars: order.stars,
        referral_amount: order.exchange,
        created_at: order.created_at,
        updated_at: order.updated_at,
      };
    }));

    // Emit the orders with populated details to all connected clients
    socket.emit('orderCanceledUpdated', { total: orders.length, orders: response });
  })
  .catch(err => {
    console.error('Error retrieving order history:', err.message);
  });



  Order.find({ status: 'pending' })
  .populate({
    path: 'client_id',
    populate: {
      path: 'user_id',
      model: 'User',
      select: 'firstName lastName'
    }
  })
  .populate({
    path: 'address_id',
    select: 'address_line'
  })
  .then(async (orders) => {
    const response = await Promise.all(orders.map(async (order) => {
      const orderItems = await OrderItem.find({ Order_id: order._id }).populate('product_id');

      return {
        order_number: order._id,
        client_name: `${order.client_id?.user_id?.firstName || 'N/A'} ${order.client_id?.user_id?.lastName || 'N/A'}`,
        address_line: order.address_id?.address_line || 'N/A',
        products: orderItems.map(item => ({
          product: item.product_id,
          quantity: item.quantity,
          service_type: item.service_type,
          price: item.price,
          selected_options: item.selected_options
        })),
        total_price: order.total_price,
        delivery_time: order.updated_at,
        payment_method: order.payment_method,
        exchange: order.exchange,
        referral_amount: order.exchange,
        created_at: order.created_at,
        updated_at: order.updated_at,
      };
    }));

    // Emit the orders with populated details to all connected clients
    socket.emit('orderCanceledUpdated', { total: orders.length, orders: response });
  })
  .catch(err => {
    console.error('Error retrieving order history:', err.message);
  });

  


  
 const User = require('./models/User'); // Make sure to require your User model

 User.find({ userType: 'Driver' }).then((drivers) => {
  socket.emit('driversUpdated', { drivers });
});



User.find({ userType: 'Client' }).then((clients) => {
  socket.emit('clientsUpdated', { clients });
});




socket.on('watchChatMessages', async () => {
  try {
    // Fetch all chat supports
    const chats = await ChatSupport.find().populate('client_id').populate('admin_id');

    if (chats) {
      const lastMessages = await Promise.all(chats.map(async (chat) => {
        const lastMessage = chat.messages[chat.messages.length - 1]; // Get the last message
        if (lastMessage) {
          const cliento = await Client.findById(chat.client_id);
          if (cliento) {
            const client = await User.findById(cliento.user_id )
            return {
              clientId: client._id, // Include the clientId
              clientFullName: `${client.firstName} ${client.lastName}`,
              userType: client.userType,
              lastMessage,
            };
          }else{
            const bb = await Driver.findById(chat.client_id);
            console.log(bb)
            const client = await User.findById(bb.user_id )
            return {
              clientId: client._id, // Include the clientId
              clientFullName: `${client.firstName} ${client.lastName}`,
              userType: client.userType,
              lastMessage,
            };
          }
        }
        return null;
      }));

      // Filter out any null results
      const validMessages = lastMessages.filter(msg => msg !== null);

      // Emit the last messages to the client
      socket.emit('chatMessagesUpdated', { messages: validMessages });

      // Watch for changes to the ChatSupport collection
      const chatChangeStream = ChatSupport.watch();
      chatChangeStream.on('change', async (change) => {
        if (['insert', 'update', 'delete'].includes(change.operationType)) {
          const updatedChats = await ChatSupport.find().populate('client_id').populate('admin_id');
          const updatedMessages = await Promise.all(updatedChats.map(async (chat) => {
            const lastMessage = chat.messages[chat.messages.length - 1];
            if (lastMessage) {
              const cliento = await Client.findById(chat.client_id);
              if (cliento) {
                const client = await User.findById(cliento.user_id )
                return {
                  clientId: client._id, // Include the clientId
                  clientFullName: `${client.firstName} ${client.lastName}`,
                  userType: client.userType,
                  lastMessage,
                };
              }else{
                const bb = await Driver.findById(chat.client_id);
                console.log(bb)
                const client = await User.findById(bb.user_id )
                return {
                  clientId: client._id, // Include the clientId
                  clientFullName: `${client.firstName} ${client.lastName}`,
                  userType: client.userType,
                  lastMessage,
                };
              }
            }
            return null;
          }));

          const validUpdatedMessages = updatedMessages.filter(msg => msg !== null);
          socket.emit('chatMessagesUpdated', { messages: validUpdatedMessages });
        }
      });
    }
  } catch (error) {
    console.error('Error finding or watching chats:', error);
  }
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
module.exports = { io, server };
