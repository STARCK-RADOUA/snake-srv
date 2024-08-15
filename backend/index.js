// index.js

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
require('dotenv').config();
const clientController = require('./controllers/ClientController');
const notificationController = require('./controllers/notificationController');
const loginController = require('./controllers/LoginController'); // Import the login controller
const ProductController = require('./controllers/ProductController'); // Import the login controller
const addressRoutes = require('./routes/addressRoute');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoute');
const clientRoutes = require('./routes/clientRoutes');
const driverRoutes = require('./routes/driverRoutes');
const cartRoute = require('./routes/cartRoute');
const orderRoutes = require('./routes/orderRoutes');
const orderHistoryRoutes = require('./routes/orderHistoryRoutes');
const orderItemRoutes = require('./routes/orderItemRoutesr');
const productRoutes = require('./routes/productRoutes');
const profileRoutes = require('./routes/ProfileRoute');
const referralRoutes = require('./routes/referralRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const userRoutes = require('./routes/userRoutes');
const { Server } = require('socket.io');
const cors = require('cors');

// Initialize express and create HTTP server
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
<<<<<<< HEAD
        origin: "'http://192.168.8.131:4000'",
=======
        origin: "'http://192.168.1.35:4000'",
>>>>>>> 1c6093ab53c585ff144225e4574c9f772b3d73b6
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
// In your login controller

  socket.on('checkActivation', async ({ deviceId }) => {
    await loginController.checkUserActivation(socket, { deviceId });
});
socket.on('requestActiveProducts', () => {
    ProductController.sendActiveProducts(socket);
  });
    socket.on('autoLogin', (data) => {
        loginController.autoLogin(socket, data); // Use the autoLogin function from the controller
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

app.use('/api/orders', orderRoutes);
app.use('/api/order-history', orderHistoryRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/products', productRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoute);






// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});