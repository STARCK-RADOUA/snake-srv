const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const User = require('./models/User'); 
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
require('dotenv').config();
const clientController = require('./controllers/ClientController');
const notificationController = require('./controllers/notificationController');
const loginController = require('./controllers/LoginController');
const orderController = require('./controllers/orderController');
const ProductController = require('./controllers/productController');
const addressRoutes = require('./routes/addressRoute');
const adminRoutes = require('./routes/adminRoutes');
const clientRoutes = require('./routes/clientRoutes');
const driverRoutes = require('./routes/driverRoutes');
const cartRoute = require('./routes/cartRoute');
const orderRoute = require('./routes/orderRoute');

const orderHistoryRoutes = require('./routes/orderHistoryRoutes');
const orderItemRoutes = require('./routes/orderItemRoutesr');
const productRoutes = require('./routes/productRoutes');
const profileRoutes = require('./routes/ProfileRoute');
const referralRoutes = require('./routes/referralRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const userRoutes = require('./routes/userRoutes');

const chatRoutes = require('./routes/chatRoutes');

const cors = require('cors');

// Initialize express and create HTTP server
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {

        origin: 'http://192.168.8.119:4000',

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

    socket.on('registerClient', async (data) => {
        console.log('Register client data:', data);

        const req = { body: data, io: io }; // Simulated request object
        const res = {
            status: (statusCode) => ({
                json: (responseData) => {
                    console.log('Response data:', responseData);
                }
            })
        };

        try {
            await clientController.saveClient(req, res);
            io.emit('clientRegistered', { message: 'Client registered successfully!' });
        } catch (error) {
            console.error('Error registering client:', error);
            io.emit('clientRegistered', { message: 'Error registering client' });
        }
    });

    socket.on('checkActivation', async ({ deviceId }) => {
        await loginController.checkUserActivation(socket, { deviceId });
    });

    socket.on('requestActiveProducts', () => {
        ProductController.sendActiveProducts(socket);
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
  socket.on('checkOrderStatus', async ({ clientId }) => {
    try {
      const order =await orderController.checkOrderStatus(clientId);
      if (order) {
        socket.emit('orderStatusUpdate', { status: order.status });
      }
    } catch (error) {
      console.error('Error checking order status:', error);
    }
  });
  

  socket.on('joinChat', ({ chatId }) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat room ${chatId}`);
});

// Handle message sending
socket.on('sendMessage', async (data) => {
  const { chatId, sender, content } = data;
  try {
      const chat = await ChatSupport.findById(chatId);
      if (!chat) {
          socket.emit('errorMessage', 'Chat not found');
          return;
      }
      chat.messages.push({ sender, content, timestamp: new Date() });
      await chat.save();
      io.to(chatId).emit('newMessage', { sender, content, timestamp: new Date() });
  } catch (error) {
      socket.emit('errorMessage', 'Error sending message');
  }
});

  
  

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Routes
app.use('/api/addresses', addressRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/clients', clientRoutes);

app.use('/api/drivers', driverRoutes);

app.use('/api/order-history', orderHistoryRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/products', productRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/carts', cartRoute);
app.use('/api/orders', orderRoute);


// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
