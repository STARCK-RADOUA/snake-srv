const User = require('../models/User'); // Make sure the path is correct
const Order = require('../models/Order');
const Client = require('../models/Client');

// Récupérer les commandes par deviceId
exports.getOrdersByDeviceId = async (deviceId) => {
  try {
    const user = await User.findOne({ deviceId });
    const client = await Client.findOne({ user_id: user._id });

    if (!user) {
      throw new Error('User not found');
    }

    const orders = await Order.find({ client_id: client._id }).populate({
      path: 'OrderItem_id',
      populate: {
        path: 'product_id'
      }
    }).populate('address_id');

    // If points are needed, you can calculate or retrieve them here
    const ordersWithPoints = orders.map(order => ({
      ...order.toObject(),
      points_earned: order.total_price * 0.1 // Example calculation, adjust as needed
    }));
console.log('------------------------------------');
console.log(orders);
console.log('------------------------------------');
    return orders;
  } catch (error) {
    console.error('Error fetching orders by device ID:', error.message);
    throw error;
  }
};

// Ajouter une nouvelle commande
exports.addOrder = async (orderData, io) => {
  try {
    const order = new Order(orderData);
    await order.save();

    // Emit the new order to all connected clients
    io.emit('newOrder', order);

    return order;
  } catch (error) {
    console.error('Error adding new order:', error.message);
    throw error;
  }
};
