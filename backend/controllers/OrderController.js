const User = require('../models/User');
const Order = require('../models/Order');
const ClarkeWright = require('./ClarkeWright'); // Assurez-vous que le chemin est correct
const systemDown = require('../models/SystemDown');

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
    const forstDriver =  order.driver_id;
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }
    const client = await Client.findById(order.client_id);

    // Find the driver by ID
    const driver = await Driver.findById(driverId);
    const user44 = await User.findById(driver.user_id);
    const deviceId =  user44.deviceId;

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
    const driver1 = await Driver.findById(forstDriver);
    if (!driver1) {
      console.log('Driver not found:', forstDriver);
      return res.status(404).json({ message: 'Driver not found' });
    }
    const userDriver = await User.findById(driver1.user_id) ;
const deviceId1= userDriver.deviceId ;
await this.fetchInProgressOrdersForDriver(io,deviceId1) ;

await this.fetchInProgressOrdersForDriver(io,deviceId) ;
const userClient = await User.findById(client.user_id);

io.to(userClient.deviceId).emit('orderStatusUpdates', { order });

const driverUp1 = await Driver.findOneAndUpdate(
  { _id: forstDriver},
  { orders_count: driver1.orders_count-1 },
  { new: true } // Retourne la commande mise à jour
);



const driverUp = await Driver.findOneAndUpdate(
    { _id: order.driver_id },
    { orders_count: driver.orders_count+1 },
    { new: true } // Retourne la commande mise à jour
);






    
    res.status(200).json({ message: 'Order successfully assigned', order });
  } catch (error) {
    console.error('Error assigning order to driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


//////////////////////////////////////////////////////////////////////



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
    const driver = await Driver.findOne({user_id: user._id});
    if (!driver) {
      console.error('Driver not found for user ID:', user._id);
      return;
    }

    // Fetch active and in-progress orders for the driver
    const orders = await Order.find({ driver_id: driver._id, status: 'in_progress'  })
    
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
      select: 'address_line localisation'
    }) ;
    const response = await Promise.all(orders.map(async (order) => {
      const orderItems = await OrderItem.find({ Order_id: order._id }).populate('product_id');
      
      console.log(order)
      return {
        order_number: order._id,
        client_id : order.client_id._id ,
        driver_id : order.driver_id._id ,
        client_name: `${order.client_id?.user_id?.firstName || 'N/A'} ${order.client_id?.user_id?.lastName || 'N/A'}`,
        driver_name: order.driver_id ? `${order.driver_id.user_id.firstName} ${order.driver_id.user_id.lastName}` : null,
        address_line: order.address_id?.address_line || 'N/A',
        location: order.address_id?.localisation || 'N/A',
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

    // Emit the orders to the Driver
    io.to(deviceId).emit('orderInprogressUpdatedForDriver', { total: orders.length, orders: response, active: driver.isDisponible });
  } catch (err) {
    console.error('Error fetching in-progress orders:', err.message);
  }
};

exports.fetchOrdersAndGeneratePDF = async (req, res) => {
  const { driverId } = req.params; // Get driverId from URL parameters
  const { startDate, endDate } = req.query; // Get the start and end dates from query parameters

  try {
    // Fetch orders for the specified driver
    const orders = await Order.find({
      driver_id: driverId,
      status: 'delivered',
      created_at: { $gte: new Date(startDate), $lte: new Date(endDate) },
    })
      .populate({
        path: 'client_id',
        populate: {
          path: 'user_id',
          model: 'User',
          select: 'firstName lastName',
        },
      })
      .populate({
        path: 'driver_id',
        populate: {
          path: 'user_id',
          model: 'User',
          select: 'firstName lastName',
        },
      })
      .populate({
        path: 'address_id',
        select: 'address_line localisation',
      });

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for the specified driver and date range.' });
    }

    const response = await Promise.all(
      orders.map(async (order) => {
        const orderItems = await OrderItem.find({ Order_id: order._id }).populate('product_id');

        return {
          order_number: order._id,
          client_id: order.client_id._id,
          driver_id: order.driver_id._id,
          client_name: `${order.client_id?.user_id?.firstName || 'N/A'} ${order.client_id?.user_id?.lastName || 'N/A'}`,
          driver_name: order.driver_id ? `${order.driver_id.user_id.firstName} ${order.driver_id.user_id.lastName}` : null,
          address_line: order.address_id?.address_line || 'N/A',
          location: order.address_id?.localisation || 'N/A',
          products: orderItems.map((item) => ({
            product: item.product_id,
            quantity: item.quantity,
            service_type: item.service_type,
            isFree: item.isFree,
            price: item.price,
            selected_options: item.selected_options,
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
      })
    );

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, order) => acc + order.total_price, 0);

    // Generate PDF
    const pdfBuffer = await generatePDF(response, totalOrders, totalRevenue, startDate, endDate);

    // Set the appropriate headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="orders_report.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    // Send the PDF buffer
    res.end(pdfBuffer); // Use res.end() to send the buffer
  } catch (err) {
    console.error('Error fetching orders and generating PDF:', err.message);
    res.status(500).json({ error: 'An error occurred while generating the PDF' });
  }
};

const puppeteer = require('puppeteer');

const generatePDF = async (orders, totalOrders, totalRevenue, startDate, endDate) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Define HTML content for the PDF
  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Rapport des Commandes du Livreur</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          padding-left: 20px;
          padding-right: 20px;
        }
        h1 {
          text-align: center;
          color: #333;
        }
        h2 {
          color: #555;
          border-bottom: 2px solid #ccc;
          padding-bottom: 10px;
        }
        .summary {
          text-align: center;
          margin-bottom: 20px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        .summary h2 {
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          page-break-inside: avoid; /* Prevent breaking inside table */
        }
        table, th, td {
          border: 1px solid #ddd;
        }
        th, td {
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          color: #333;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9; /* Light gray for even rows */
        }
        tr:nth-child(odd) {
          background-color: #ffffff; /* White for odd rows */
        }
        .order-divider {
          border-top: 3px solid #ccc;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <h1>Rapport des Commandes du Livreur</h1>
      <div class="summary">
        <h2>Chiffre d'Affaires et Total Commandes de ${startDate} à ${endDate}</h2>
        <h2>Livreur : ${orders[0].driver_name}</h2>
        <h2>Total Commandes : ${totalOrders}</h2>
        <h2>Chiffre d'Affaires : ${totalRevenue} €</h2>
      </div>
      ${orders
        .map((order) => `
          <div class="order-divider"></div>
          <h2>Commande #${order.order_number}</h2>
          <p><strong>Client :</strong> ${order.client_name}</p>
          <p><strong>Livreur :</strong> ${order.driver_name || 'N/A'}</p>
          <p><strong>Adresse :</strong> ${order.address_line}</p>
          <p><strong>Localisation :</strong> ${order.location}</p>
          <p><strong>Prix Total :</strong> ${order.total_price} €</p>
          <p><strong>Méthode de Paiement :</strong> ${order.payment_method}</p>
          <p><strong>Heure de Livraison :</strong> ${new Date(order.delivery_time).toLocaleString()}</p>
          <table>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix</th>
              <th>Type de Service</th>
            </tr>
            ${order.products
              .map(
                (product) => `
                <tr>
                  <td>${product.product.name || 'N/A'}</td>
                  <td>${product.quantity}</td>
                  <td>${product.price} €</td>
                  <td>${product.product.service_type || 'N/A'}</td>
                </tr>`
              )
              .join('')}
          </table>
          <div class="order-divider"></div>
        `)
        .join('')}
    </body>
  </html>
`;

  // Set the HTML content for Puppeteer
  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

  // Generate the PDF
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' } });

  await browser.close();

  return pdfBuffer;
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
      const client = await Client.findById(order.client_id);
const userclient = await User.findById(client.user_id);
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



// Function to get available drivers with the current tranche
async function getAvailableDrivers(tranche) {
    try {
        const drivers = await Driver.find({ orders_count: { $lt: tranche },isDisponible: true });
        return drivers;
    } catch (error) {
        console.error('Error retrieving available drivers:', error.message);
        throw new Error('Error retrieving available drivers.');
    }
}



exports.resetOrdersAndDriverByDeviceId = async (deviceId) => {
  try {
    // 1. Trouver le User avec le deviceId fourni
    const user = await User.findOne({ deviceId, userType: 'Driver' });
    if (!user) {
      return { success: false, message: 'Livreur non trouvé avec ce deviceId' };
    }

    // 2. Trouver le driver correspondant à ce user_id
    const driver = await Driver.findOne({ user_id: user._id });
    if (!driver) {
      return { success: false, message: 'Aucun livreur trouvé pour cet utilisateur' };
    }

    // 3. Trouver toutes les commandes in_progress pour ce driver
    const inProgressOrders = await Order.find({ driver_id: driver._id, status: 'in_progress' });
    if (inProgressOrders.length === 0) {
      return { success: false, message: 'Aucune commande en cours pour ce livreur' };
    }

    // 4. Mettre à jour les commandes trouvées : status => 'pending', driver_id => null
    await Order.updateMany(
      { driver_id: driver._id, status: 'in_progress' },
      { $set: { status: 'pending', driver_id: null } }
    );
    const pendi = await Order.find({ status: 'pending' });
console.log(pendi)
console.log("inpro",inProgressOrders)
    // 5. Envoyer les notifications de mise à jour aux clients
    for (const order of pendi) {
      try {
        // Récupérer le client associé à la commande
        const client = await Client.findById(order.client_id);
        if (!client) {
          console.log(`Client not found for order: ${order._id}`);
          continue;
        }
    
        // Récupérer l'utilisateur (User) associé au client
        const userClient = await User.findById(client.user_id);
        if (!userClient || !userClient.deviceId) {
          console.log(`User or deviceId not found for client: ${client._id}`);
          continue;
        }
    
        // Émettre les mises à jour d'état de commande
        const { io } = require('../index');
        io.to(userClient.deviceId).emit('orderStatusUpdates', { order });
      } catch (error) {
        console.error(`Error processing order ${order._id}:`, error);
      }
    }

    // 6. Mettre à jour le livreur : indisponible, déconnecté, et réinitialiser le nombre de commandes
    await Driver.findByIdAndUpdate(
      driver._id,
      {
        isDisponible: false,
        'location.isConnected': false,
        orders_count: 0
      },
      { new: true }
    );

    return {
      success: true,
      message: 'Les commandes en cours ont été réinitialisées et le livreur est déconnecté',
      driver: driver._id,
      ordersUpdated: inProgressOrders.length
    };
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des commandes et du livreur:', error);
    return { success: false, message: 'Erreur lors de la mise à jour' };
  }
};






// Function to dynamically adjust tranches

async function adjustTranche() {
  // Récupérer la configuration de l'admin
  const admin = await Admin.findOne({ isSystem: true });

  if (!admin) {
      console.error('Aucune configuration admin trouvée.');
      return;
  }

  const { actuTranche, MAX_TRANCHE } = admin;

  // Récupérer tous les livreurs disponibles
  const drivers = await Driver.find({ isDisponible: true });
  const trancheCounts = drivers.map(driver => driver.orders_count);

  // Gérer les cas où il n'y a pas de livreurs
  if (trancheCounts.length === 0) {
      console.log('Aucun livreur disponible pour ajuster la tranche.');
      return;
  }

  const maxOrders = Math.max(...trancheCounts);
  const minOrders = Math.min(...trancheCounts);

  let currentTranche = parseInt(actuTranche, 10);
  const maxTranche = parseInt(MAX_TRANCHE, 10);
  const trancheIncrement = 10; // Incrémentation fixe
console.log("minOrders",minOrders)
console.log("currentTranche",currentTranche)
console.log("trancheIncrement",trancheIncrement)
console.log("maxOrders",maxOrders)
  // Ajuster la tranche en fonction des conditions
  if (minOrders >= currentTranche && maxTranche >= currentTranche + trancheIncrement && currentTranche < maxTranche) {
      currentTranche += trancheIncrement;
  } else if (maxOrders < currentTranche - trancheIncrement && currentTranche > trancheIncrement) {
      currentTranche -= trancheIncrement;
  }

  // Mettre à jour la tranche actuelle dans le modèle Admin
  admin.actuTranche = currentTranche;
  await admin.save();

  console.log(`La tranche actuelle a été ajustée à : ${currentTranche}`);

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

    for (const order of pendingOrders ) {
      try {
        // Assign each pending order to a driver
        const assignedDriver = await exports.assignOrderToDriver(order._id);
        console.log(`Order ${order._id} assigned to driver ${assignedDriver._id}`);
    
 
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
    if (!order || order.status !== "pending") {
       throw new Error('Order not found');
    }

    let tranche = await adjustTranche();
    let drivers = await getAvailableDrivers(tranche);

    if (drivers.length === 0) {
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
      const inProgressOrders = await Order.find({ _id:order._id ,driver_id: bestDriver._id, status: 'in_progress' });
      if (inProgressOrders.length !== 0) {
      
        return ;
      }
        order.driver_id = bestDriver._id;
        order.status = "in_progress";
        bestDriver.orders_count += 1;
        await bestDriver.save();
        await order.save();
        const user = await User.findById(bestDriver.user_id);
const client = await Client.findById(order.client_id);
const userclient = await User.findById(client.user_id);
        const { io } = require('../index');
        io.to(userclient.deviceId).emit('orderStatusUpdates', { order });
        await exports.fetchInProgressOrdersForDriver(io, user.deviceId);

     

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


exports.getAllDriverStatsBytime  = async (req, res) => {
  console.log("wa3")
  const { startDate, endDate } = req.query;

  try {
    const driverStats = await Driver.aggregate([
      {
        // Join with User collection
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        // Unwind the joined user array (since it is a single user, not an array)
        $unwind: '$userInfo'
      },
      {
        // Join with Order collection
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'driver_id',
          as: 'orders'
        }
      },
      {
        // Add fields to calculate delivered orders and total revenue between startDate and endDate
        $addFields: {
          deliveredOrders: {
            $size: {
              $filter: {
                input: '$orders',
                as: 'order',
                cond: {
                  $and: [
                    { $eq: ['$$order.status', 'delivered'] },
                    { $gte: ['$$order.created_at', new Date(startDate)] },
                    { $lte: ['$$order.created_at', new Date(endDate)] }
                  ]
                }
              }
            }
          },
          totalRevenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$orders',
                    as: 'order',
                    cond: {
                      $and: [
                        { $eq: ['$$order.status', 'delivered'] },
                        { $gte: ['$$order.created_at', new Date(startDate)] },
                        { $lte: ['$$order.created_at', new Date(endDate)] }
                      ]
                    }
                  }
                },
                as: 'deliveredOrder',
                in: '$$deliveredOrder.total_price'
              }
            }
          }
        }
      },
      {
        // Project the required fields
        $project: {
          _id: 0, // Hide the default MongoDB _id
          driverId: '$_id',
          userId: '$userInfo._id',
          firstName: '$userInfo.firstName',
          lastName: '$userInfo.lastName',
          deliveredOrders: 1,
          totalRevenue: 1
        }
      }
    ]);

    return res.status(200).json(driverStats);
  } catch (err) {
    console.error('Error fetching driver stats:', err);
    return res.status(500).json({ error: 'Error fetching driver stats' });
  }
};
