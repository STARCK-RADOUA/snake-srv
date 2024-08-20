const User = require('../models/User');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Client = require('../models/Client');
const Address = require('../models/Address');
const Cart = require('../models/Cart');

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
    const orders = await Order.find({ client_id: client._id ,active:true})
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
 

    console.log('------------------------------------');
    console.log(ordersWithItems);
    console.log('------------------------------------');

    return ordersWithItems;
  } catch (error) {
    console.error('Error fetching orders by device ID:', error.message);
    throw error;
  }
};
exports.addOrder = async (orderData,io) => {
    try {
      const exchange = orderData.exchange;
const paymentMethod = orderData.paymentMethod;

// Accéder aux détails de la commande
const addressLine = orderData.orderdetaille.data.address_line;
const building = orderData.orderdetaille.data.building;
const floor = orderData.orderdetaille.data.floor;
const door_number = orderData.orderdetaille.data.door_number;
const digicode = orderData.orderdetaille.data.digicode;
const comment = orderData.orderdetaille.data.comment;
const location = orderData.orderdetaille.data.location;

const newOrder = orderData.orderdetaille.data.newOrder;
console.log('------------------------------------');
console.log(newOrder);
console.log('------------------------------------');

const deviceId = orderData.orderdetaille.data.newOrder.deviceId;
const user_id = orderData.orderdetaille.data.user_id;
console.log('Device ID:', user_id);

const totalPrice = orderData.orderdetaille.data.newOrder.newOrder.totalPrice;





      // Find the user by deviceId
      const user = await User.findOne({ _id: user_id });
      if (!user) {
        console.error('User not found for Device ID:', deviceId);
        throw new Error('User not found');
      }
  
      // Find the client associated with the user
      const client = await Client.findOne({ user_id: user._id });
      if (!client) {
        throw new Error('Client not found');
      }
  
      // Fetch the OrderItems from the client's cart (assuming there is a cart collection or order items linked to the client)
  
      const address = new Address({
        user_id: user._id,
        address_line: addressLine,
        building: building,
        localisation: location,
        floor: floor,
        door_number: door_number,
        digicode: digicode,
        comment: comment,
      });
      await address.save();
      // Create a new order
      const order = new Order({
        client_id: client._id,
        address_id: address._id,
        status: 'pending',
        active: true,
        payment_method: paymentMethod,
        exchange: exchange,
        total_price: totalPrice,
      });
  
      // Save the new order
      await order.save();
      const cart = await Cart.findOne({ client_id: client._id });
      console.log('Cart:', cart._id);
      const orderItems = await OrderItem.find({cart_id: cart._id,Order_id: null ,active : true }); // Assuming Order_id is null for cart items
  
      if (!orderItems || orderItems.length === 0) {
        throw new Error('No items found in the cart');
      }
      // Update the Order_id field in the order items associated with this order
      const orderItemIds = orderItems.map(item => item._id); // Extract order item IDs
      await OrderItem.updateMany(
        { _id: { $in: orderItemIds } },  // Find all items in the client's cart
        { 
          $set: { 
            Order_id: order._id,  // Assign the new order ID
            active: false          // Set `active` to false
          } 
        }
      );
      
      // Emit the new order to all connected clients
      io.emit('newOrder', order);
  
      return order._id;
    } catch (error) {
      console.error('Error adding new order:', error.message);
      throw error;
    }
  };





// Controller to update exchange and payment_method
exports.updateOrderPayment = async (req, res) => {
  const { orderId } = req.params;  // Get order ID from request parameters
  const { exchange, paymentMethod } = req.body;  // Get exchange and payment method from request body

  try {
    // Find the order by ID and update the exchange and payment method
    const order = await Order.findByIdAndUpdate(
      orderId, 
      { exchange, payment_method: paymentMethod }, 
      { new: true }
    );

    // If no order is found, return a 404 error
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Send the updated order back to the client
    res.status(200).json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.checkOrderStatus = async (order_id) => {

   try {
    // Fetch the user and client based on deviceId
    console.log("HHHHHHDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD")
  console.log(order_id)

    // Fetch all orders for the client
    const orders = await Order.find({ _id: order_id ,active:true});
     
console.log('orders:', orders);
    if (!orders) {
      throw new Error('order not found statutus');
    }

    // Fetch order items related to these orders
   
    // Calculate points and other details if needed
   


    return orders;
  } catch (error) {
    console.error('Error fetching orders by device ID:', error.message);
    throw error;
  }
};

  
exports.updateOrderFeedback = async (req, res) => {
  try {
    const { orderId, stars, comment } = req.body;

    // Debug input validation
    console.log("Received feedback update request with:", { orderId, stars, comment });

    if (!orderId) {
      console.error("No orderId provided");
      return res.status(400).json({ message: 'Order ID is required' });
    }

    if (typeof stars !== 'number' || stars < 1 || stars > 5) {
      console.error(`Invalid stars value: ${stars}`);
      return res.status(400).json({ message: 'Stars rating must be a number between 1 and 5' });
    }

    if (typeof comment !== 'string' || comment.trim() === '') {
      console.error("Invalid comment value");
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    // Log before database interaction
    console.log(`Updating order ${orderId} with stars: ${stars}, comment: "${comment}"`);

    // Find the order by ID and update the stars and comment
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        stars: stars,
        comment: comment,
      },
      { new: true } // This option ensures the updated document is returned
    );

    // Log the result of the database operation
    if (!order) {
      console.error(`Order with ID ${orderId} not found`);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(`Order ${orderId} updated successfully`, order);

    // Send the updated order as a response
    res.json({ message: 'Feedback updated successfully', order });
  } catch (error) {
    console.error('Error updating feedback:', error.message);
    console.error(error.stack); // Log the full error stack trace for debugging
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Update the 'active' field to false
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { active: false }, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order successfully cancelled', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Update driver_id in Order
exports.updateDriverId = async (req, res) => {
  try {
    const { orderId, driverId } = req.body;

    // Find the order and update the driver_id
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { driver_id: driverId },
      { new: true } // Returns the updated document
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({
      message: 'Driver ID updated successfully',
      updatedOrder,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};