const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
require('dotenv').config();
const clientController = require('./controllers/ClientController');
const notificationController = require('./controllers/notificationController');
const loginController = require('./controllers/LoginController');
const orderController = require('./controllers/orderController');
const serviceRoutes = require('./routes/serviceRoutes');
const ProductController = require('./controllers/productController');
const addressRoutes = require('./routes/addressRoute');
const adminRoutes = require('./routes/adminRoutes');
const clientRoutes = require('./routes/clientRoutes');
const driverRoutes = require('./routes/driverRoutes');
const cartRoute = require('./routes/cartRoute');
const orderRoute = require('./routes/orderRoute');
const chatRoute = require('./routes/chatRoute');
const ChatSupport = require('./models/ChatSupport');

const orderHistoryRoutes = require('./routes/orderHistoryRoutes');
const orderItemRoutes = require('./routes/orderItemRoutesr');
const productRoutes = require('./routes/productRoutes');
const profileRoutes = require('./routes/ProfileRoute');
const referralRoutes = require('./routes/referralRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const userRoutes = require('./routes/userRoutes');
const Order = require('./models/Order'); // Your Order model

const chatRoutes = require('./routes/chatRoutes');

const cors = require('cors');

// Initialize express and create HTTP server
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {

        origin: 'http://192.168.0.109:4000',

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
        const res = {
            status: (statusCode) => ({
                json: (responseData) => {
                    console.log('Response data:', responseData);
                    // Informer le client via socket.io en fonction de la réponse du contrôleur
                    if (statusCode === 201) {
                        io.emit('clientRegisteredLC', { message: 'success', details: responseData.details });
                    } else {
                        io.emit('clientRegisteredLC', { message: 'error', details: responseData.errors.join(', ') });
                    }
                }
            })
        };
    
        try {
            await clientController.saveClientLC(req, res);
        } catch (error) {
            console.error('Error registering client:', error);
            io.emit('clientRegisteredLC', { message: 'error', details: 'Error registering client' });
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
            socket.emit('loginSuccess', { userId: user._id, message: 'Login successful' });
    
        } catch (error) {
            console.error('Error during auto login:', error);
            socket.emit('loginFailure', { message: 'An error occurred during login' });
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
socket.on('initiateChat', async ({ adminId, clientId }) => {
    try {
      // Check if a chat exists between this admin and client
      let chat = await ChatSupport.findOne({ admin_id: adminId, client_id: clientId });
      if (!chat) {
        // If no chat exists, create a new one
        chat = new ChatSupport({
          admin_id: adminId,
          client_id: clientId,
          messages: []  // Initialize with an empty messages array
        });
        await chat.save();
      }
  
      // Join the room for this specific chat
      socket.join(chat._id.toString());
  
      if (socket.handshake.query.isAdmin === 'true') {
        // For admin: Send all messages (old, new, seen, unseen)
        socket.emit('chatDetails', { chatId: chat._id, messages: chat.messages });
      } else {
        // For client: Filter only unseen messages from the admin
        const unseenMessages = chat.messages.filter(msg => msg.sender === 'admin' && !msg.seen);
  
        // Mark unseen messages as seen when sending to the client
        unseenMessages.forEach(msg => {
          msg.seen = true; // Mark as seen
        });
        await chat.save(); // Save updated chat with seen messages
  
        // Send only the unseen messages to the client
        socket.emit('chatDetails', { chatId: chat._id, messages: unseenMessages });
      }
    } catch (error) {
      console.error('Error initiating chat:', error);
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
        seen: sender === 'admin' // Admin messages are marked as seen, client messages are unseen
      };
      chat.messages.push(newMessage);
      await chat.save();
  
      // Emit the new message to everyone in the chat room
      io.to(chatId).emit('newMessage', { message: newMessage });
    } catch (error) {
      console.error('Error sending message:', error);
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


// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
