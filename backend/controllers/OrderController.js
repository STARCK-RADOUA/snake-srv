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
      .populate('client_id')
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
exports.addOrder = async (deviceId, totalPrice, io) => {
    try {
      // Find the user by deviceId
      const user = await User.findOne({ deviceId });
      if (!user) {
        throw new Error('User not found');
      }
  
      // Find the client associated with the user
      const client = await Client.findOne({ user_id: user._id });
      if (!client) {
        throw new Error('Client not found');
      }
  
      // Fetch the OrderItems from the client's cart (assuming there is a cart collection or order items linked to the client)
      const orderItems = await OrderItem.find({ client_id: client._id, Order_id: null }); // Assuming Order_id is null for cart items
  
      if (!orderItems || orderItems.length === 0) {
        throw new Error('No items found in the cart');
      }
  
      // Create a new order
      const order = new Order({
        client_id: client._id,
        status: 'pending',
        total_price: totalPrice,
      });
  
      // Save the new order
      await order.save();
  
      // Update the Order_id field in the order items associated with this order
      const orderItemIds = orderItems.map(item => item._id); // Extract order item IDs
      await OrderItem.updateMany(
        { _id: { $in: orderItemIds } },  // Find all items in the client's cart
        { Order_id: order._id }          // Assign the new order ID
      );
  
      // Emit the new order to all connected clients
      io.emit('newOrder', order);
  
      return order;
    } catch (error) {
      console.error('Error adding new order:', error.message);
      throw error;
    }
  };
  