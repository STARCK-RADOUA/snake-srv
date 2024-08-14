const User = require('../models/User');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Client = require('../models/Client');

exports.getOrdersByDeviceId = async (deviceId) => {
  try {
    // Fetch the user and client based on deviceId
    const user = await User.findOne({ deviceId });
    if (!user) {
      throw new Error('User not found');
    }

    const client = await Client.findOne({ user_id: user._id });
    if (!client) {
      throw new Error('Client not found');
    }

    // Fetch all orders for the client
    const orders = await Order.find({ client_id: client._id })
      .populate('address_id')
      .lean();

    if (orders.length === 0) {
      return [];  // Return early if no orders found
    }

    // Fetch order items related to these orders
    const orderIds = orders.map(order => order._id);
    console.log('------------------------------------');
    console.log(orderIds);
    console.log('------------------------------------');
    console.log(orderIds);
    const orderItems = await OrderItem.find({ Order_id: { $in: orderIds } })
      .populate('product_id')
      .lean();

    // Map order items to their respective orders
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: orderItems.filter(item => item.Order_id.equals(order._id))
    }));

    // Calculate points and other details if needed
    const ordersWithPoints = ordersWithItems.map(order => ({
      ...order,
      points_earned: order.total_price * 0.1 // Example points calculation
    }));

    console.log('------------------------------------');
    console.log(ordersWithPoints);
    console.log('------------------------------------');

    return ordersWithPoints;
  } catch (error) {
    console.error('Error fetching orders by device ID:', error.message);
    throw error;
  }
};

exports.addOrder = async (orderData, io) => {
  try {
    // Create the new order
    const order = new Order(orderData);
    await order.save();

    // Update the Order_id field in the order items associated with this order
    await OrderItem.updateMany(
      { _id: { $in: orderData.items } },  // Assuming items array contains the order item IDs
      { Order_id: order._id }
    );

    // Emit the new order to all connected clients
    io.emit('newOrder', order);

    return order;
  } catch (error) {
    console.error('Error adding new order:', error.message);
    throw error;
  }
};
