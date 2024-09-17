const User = require('../models/User');
const Order = require('../models/Order');
const ClarkeWright = require('./ClarkeWright'); // Assurez-vous que le chemin est correct

const OrderItem = require('../models/OrderItem');
const Admin = require('../models/Admin');
const Address = require('../models/Address');
const Cart = require('../models/Cart');
const Client = require('../models/Client');
const Driver = require('../models/Driver');
const notificationController  =require('./notificationController');
const ExcelJS = require('exceljs');
const fs = require('fs');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
exports.getOrdersByDeviceId = async (deviceId) => {
  try {
    // Fetch the user and client based on deviceId
    const user = await User.findOne({ deviceId: deviceId, userType: 'Admin' });
    if (!user) {
      throw new Error('User not found');
    }

    const admin = await Admin.findOne({ user_id: user._id });
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Fetch all orders for the client
    const orders = await Order.find()
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
const serviceTest = orderData.serviceTest;
const serviceId = orderData.serviceId;

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


   const client = await Client.findOne({ _id: user_id });
      if (!client) {
        throw new Error('Client not found');
      }
  


      // Find the user by deviceId
      const user = await User.findOne({ _id: client.user_id });
      if (!user) {
        console.error('User not found for Device ID:', deviceId);
        throw new Error('User not found');
      }

      // Find the client associated with the user
   
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
        service_id: serviceId,
        status: serviceTest?'test':'pending',
        active: true,
        payment_method: paymentMethod,
        exchange: exchange,
        service_Test: serviceTest,
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
      if(serviceTest){

        const username = user.lastName + ' ' + user.firstName;
        const targetScreen = ' Notifications';
        const messageBody = `\n💬 *!!!!Nouvelle Commande de service en test*\n\n📌 *Détails de la Commande:*\n\n🛒 ID de Commande: \`${order._id}\`\n💰 Prix Total: \`${totalPrice}$\`\n📱 Device ID: \`${user.deviceId}\`\n\n🚫 *Commande annulée.*\n`;
        const title = ' Client vient de tester une service  ';
     
        await notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
     



        }
      // Emit the new order to all connected clients
      io.emit('newOrder', order);
      const username = user.lastName + ' ' + user.firstName;
      const targetScreen = ' Notifications';
      const messageBody = `🛍️ *Nouvelle Commande*\n\n📦 ID de Commande: \`${order._id}\`\n💰 Prix Total: \`${totalPrice}$\`\n\n📝 Merci pour votre achat !`;
      const title = ' Client vient de commander';
   
      await notificationController.sendNotificationAdmin(username,targetScreen,messageBody ,title);
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



exports.getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'delivered' })
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
      });

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
          isFree: item.isFree,
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

    res.status(200).json({ total: orders.length, orders: response });
  } catch (err) {
    console.error('Error retrieving order history:', err.message);
    res.status(500).json({ message: 'Error retrieving order history', error: err.message });
  }
};






exports.affectOrderToDriver = async (req, res) => {
  const { orderId, driverId } = req.body;

  console.log('Received request to assign order:', { orderId, driverId });

  try {
    // Find the order by order number
    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Find the driver by ID
    const driver = await Driver.findById(driverId);
    if (!driver) {
      console.log('Driver not found:', driverId);
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Assign the driver to the order
    order.driver_id = driverId;
    order.status = "in_progress"
    await order.save();


    console.log('Order successfully assigned to driver:', { orderId, driverId });

    const { io } = require('../index');
    await this.fetchPendingOrders(io) ;
    await this.fetchInProgressOrders(io) ;

    
    res.status(200).json({ message: 'Order successfully assigned', order });
  } catch (error) {
    console.error('Error assigning order to driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};






exports.fetchPendingOrders = async (socket) => {
  try {
    const orders = await Order.find({ status: 'pending' })
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
    }) ;
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
          isFree: item.isFree,

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
;

    // Emit the orders with populated details to all connected clients
    socket.emit('orderPendingUpdated', { total: orders.length, orders: response });
  } catch (err) {
    console.error('Error retrieving order history:', err.message);
  }
};


exports.fetchDilevredOrders = async (socket) => {
  try {
    const orders = await Order.find({ status: 'delivered' })
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
    }) ;
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
          isFree: item.isFree,
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
;

    // Emit the orders with populated details to all connected clients
    socket.emit('orderDeliverredUpdated', { total: orders.length, orders: response });
  } catch (err) {
    console.error('Error retrieving order history:', err.message);
  }
};


exports.fetchInProgressOrders = async (socket) => {
  try {
    const orders = await Order.find({ status: 'in_progress' })
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
    }) ;
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
          isFree: item.isFree,
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
;

    // Emit the orders with populated details to all connected clients
    socket.emit('orderInprogressUpdated', { total: orders.length, orders: response });
  } catch (err) {
    console.error('Error retrieving order history:', err.message);
  }
};




exports.fetchInProgressOrdersForDriver = async (io, deviceId) => {
  try {
    console.log('Driver reconnected:', deviceId);

    // Fetch the user based on device ID
    const user = await User.findOne({ deviceId, userType: 'Driver'});
    console.log('User:', user);
    if (!user) {
      console.error('User not found for device ID:', deviceId);
      return;
    }

    // Fetch the driver based on user ID
    const driver = await Driver.findOne({user_id: user._id});
    if (!driver) {
      console.error('Driver not found for user ID:', user._id);
      return;
    }

    // Fetch active and in-progress orders for the driver
    const orders = await Order.find({ driver_id: driver._id, status: { $in: ['active', 'in_progress'] } })
      .populate({
        path: 'client_id',
        populate: { path: 'user_id', select: 'firstName lastName' }
      })
      .populate('address_id', 'address_line')
      .exec();

    // Process each order and fetch order items
    const response = await Promise.all(orders.map(async (order) => {
      const orderItems = await OrderItem.find({ order_id: order._id }).populate('product_id');
      return {
        order_number: order._id,
        client_name: `${order.client_id?.user_id?.firstName || 'Unknown'} ${order.client_id?.user_id?.lastName || ''}`,
        driver_name: `${driver.user_id.firstName || 'Unknown'} ${driver.user_id.lastName || ''}`,
        address_line: order.address_id?.address_line || 'N/A',
        products: orderItems.map(item => ({
          product: item.product_id,
          quantity: item.quantity,
          price: item.price,
          service_type: item.service_type,
        })),
        total_price: order.total_price,
        payment_method: order.payment_method,
        created_at: order.created_at,
      };
    }));

    // Emit the orders to the client
    io.to(deviceId).emit('orderInprogressUpdatedForDriver', { total: orders.length, orders: response });
  } catch (err) {
    console.error('Error fetching in-progress orders:', err.message);
  }
};


exports.fetchCancelledgOrders = async (socket) => {
  try {
    const orders = await Order.find({ status: 'cancelled' })
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
    }) ;
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
          isFree: item.isFree,
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
;
    socket.emit('orderCanceledUpdated', { total: orders.length, orders: response });
  } catch (err) {
    console.error('Error retrieving order history:', err.message);
  }
};


exports.OnOrderStatusUpdated = async ({ order_id, io }) => {
  try {
    console.log(order_id) ;
    const order = await Order.findById(order_id);
    if (order) {
      console.log('------------------------------------');
      console.log(order);
      console.log('------------------------------------');
      // Emit the updated order status to the room
      io.to(order_id).emit('orderStatusUpdates', { order });
      io.emit('watchOrderStatuss', { order_id: order_id });

    }
  } catch (error) {
    console.error('Error finding or watching order:', error);
  }
};









// Fetch delivered orders filtered by date range
exports.fetchDriverOrdersForCount = async (socket, startISO, endISO) => {
  try {
    console.log('------------------------------------');
    console.log(startISO, endISO);
    console.log('------------------------------------');
    const start = new Date(startISO);
    const end = new Date(endISO);
    console.log(start, end);
    if (isNaN(start) || isNaN(end)) {
      return console.error('Invalid date format');
    }
    end.setDate(end.getDate() + 1);
  
      // Fetch orders
      const orders = await Order.find({
        created_at: { $gte: start, $lt: end }
      }).populate('driver_id');
  
      // Aggregate revenue per driver
      const driverRevenues = orders.reduce((acc, order) => {
        const driverId = order.driver_id._id.toString();
        if (!acc[driverId]) {
          acc[driverId] = { ...order.driver_id._doc, revenue: 0 };
        }
        acc[driverId].revenue += order.total_price;
        return acc;
      }, {});
  
      // Calculate total business revenue
      const totalBusiness = orders.reduce((total, order) => total + order.total_price, 0);
  

    socket.emit('fetchDriverOrdersForCountUpdated', {
      totalBusiness,
      driverRevenues
    });

  } catch (err) {
    console.error('Error retrieving order history:', err.message);
  }
};


// Export orders and driver info into Excel
exports.exportDriverOrdersToExcel = async (startDate, endDate, drivers, socket) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Driver Orders');

    worksheet.columns = [
      { header: 'Driver', key: 'driver', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Order ID', key: 'order_id', width: 25 },
      { header: 'Total Price', key: 'total_price', width: 15 },
      { header: 'Delivery Time', key: 'delivery_time', width: 20 },
    ];

    for (const driverId in drivers) {
      const driver = drivers[driverId];

      driver.orders.forEach(order => {
        worksheet.addRow({
          driver: driver.driver,
          phone: driver.phone,
          order_id: order,
          total_price: driver.totalRevenue,
          delivery_time: driver.updated_at,
        });
      });
    }

    const filePath = `./driver_orders_${startDate}_to_${endDate}.xlsx`;
    await workbook.xlsx.writeFile(filePath);

    socket.emit('fileReady', { path: filePath });
  } catch (err) {
    console.error('Error exporting orders to Excel:', err.message);
  }
};

const TRANCHE_INCREMENT = 10;
const MIN_TRANCHE = 10;
const MAX_TRANCHE = 30;

// Function to get available drivers with the current tranche
async function getAvailableDrivers(tranche) {
    try {
        const drivers = await Driver.find({ orders_count: { $lt: tranche } });
        return drivers;
    } catch (error) {
        console.error('Error retrieving available drivers:', error.message);
        throw new Error('Error retrieving available drivers.');
    }
}

// Function to dynamically adjust tranches
async function adjustTranche() {
    const drivers = await Driver.find({});
    const trancheCounts = drivers.map(driver => driver.orders_count);

    const maxOrders = Math.max(...trancheCounts);
    const minOrders = Math.min(...trancheCounts);

    let currentTranche = MIN_TRANCHE;

    if (minOrders >= currentTranche && maxOrders >= currentTranche + TRANCHE_INCREMENT) {
        currentTranche += TRANCHE_INCREMENT;
    } else if (maxOrders < currentTranche - TRANCHE_INCREMENT && currentTranche > MIN_TRANCHE) {
        currentTranche -= TRANCHE_INCREMENT;
    }

    return currentTranche;
}
exports.assignPendingOrders = async () => {


  try {
    // Fetch all pending orders
    const pendingOrders = await Order.find({ status: 'pending', driver_id: null });

    if (pendingOrders.length === 0) {
      console.log('No pending orders to assign.');
      return;
    }

    for (const order of pendingOrders) {
      try {
        // Assign each pending order to a driver
        const assignedDriver = await exports.assignOrderToDriver(order._id);
        console.log(`Order ${order._id} assigned to driver ${assignedDriver._id}`);
        const { io } = require('../index');
    
 
  } catch (error) {
        console.error(`Failed to assign order ${order._id}:`, error.message);
      }
    }

    console.log('Pending orders assignment completed.');
  } catch (error) {
    console.error('Error during pending orders assignment:', error.message);
    throw new Error('Pending orders assignment failed.');
  }
}

// Function to assign an order to a driver
exports.assignOrderToDriver = async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error('Order not found');
    }

    let tranche = await adjustTranche();
    let drivers = await getAvailableDrivers(tranche);

    if (drivers.length === 0) {
        // Increase margin if no drivers are available
        await Driver.updateMany({ orders_count: { $lt: MAX_TRANCHE } }, { $inc: { orders_count: TRANCHE_INCREMENT } });
        drivers = await getAvailableDrivers(tranche);

        if (drivers.length === 0) {
            throw new Error('No available drivers even after increasing margin');
        }
    }

    // Convert addresses to coordinates
    const address = await Address.findById(order.address_id);
    const { latitude: addressLat, longitude: addressLng } = parseLocation(address.localisation);

    const locations = drivers.map(driver => ({
        lat: driver.location.latitude,
        lng: driver.location.longitude,
        driverId: driver._id
    }));

    // Add the client's location as the last address
    locations.push({ lat: addressLat, lng: addressLng, driverId: null });

    // Use the driver location as start and end point
    const clarkeWright = new ClarkeWright(locations, { lat: addressLat, lng: addressLng }, {});
    const routes = clarkeWright.createRoutes();

    let bestDriver = null;
    let minDistance = Infinity;

    routes.forEach(route => {
      let routeDistance = 0;
  
      route.forEach((loc, idx) => {
          if (idx < route.length - 1) {
              const nextLoc = route[idx + 1];
              routeDistance += clarkeWright.calculateDistance(loc, nextLoc);
          }
      });
  
      const driverLocation = route.find(loc => loc.driverId)?.driverId;
      if (driverLocation && routeDistance < minDistance) {
          const driver = drivers.find(driver => driver._id.toString() === driverLocation.toString());
          if (driver) {
              minDistance = routeDistance;
              bestDriver = driver;
          }
      }
  });
  

    if (bestDriver) {
        order.driver_id = bestDriver._id;
        order.status = "in_progress";
        bestDriver.orders_count += 1;
        await bestDriver.save();
        await order.save();
        const { io } = require('../index');
        io.emit('orderStatusUpdates', { order });
        
     

        return bestDriver;
    } else {
        throw new Error('No suitable driver found');
    }
}

function parseLocation(location) {
    const [latitude, longitude] = location.split(',').map(coord => parseFloat(coord));
    return { latitude, longitude };
}



exports.fetchTestOrders = async (socket) => {
  try {
    const orders = await Order.find({ status: 'test' })
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
    }) ;
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
          isFree: item.isFree,
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
;

    // Emit the orders with populated details to all connected clients
    socket.emit('testOrderUpdated', { total: orders.length, orders: response });
  } catch (err) {
    console.error('Error retrieving order history:', err.message);
  }
};