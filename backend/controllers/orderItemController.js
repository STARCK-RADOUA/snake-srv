const OrderItem = require('../models/OrderItem');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// Get all order items
exports.getAllOrderItems = async (req, res) => {
    try {
        const orderItems = await OrderItem.find().populate('product_id');
        res.status(200).json(orderItems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order items' });
    }
};

// Get an order item by ID
exports.getOrderItemById = async (req, res) => {
    try {
        const orderItem = await OrderItem.findById(req.params.id).populate('order_id').populate('product_id');
        if (!orderItem) {
            return res.status(404).json({ error: 'Order item not found' });
        }
        res.status(200).json(orderItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order item' });
    }
};

// Create a new order item

exports.getOrderItemsByCart = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { serviceName } = req.params;
    
    console.log('Received clientId (backend):', clientId,serviceName); // Check the value of clientId here

    if (!clientId) {
      return res.status(400).json({ error: 'clientId is missing in the request' });
    }

    const cart = await Cart.findOne({ client_id: clientId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found for this user' });
    }

    const orderItems = await OrderItem.find({ cart_id: cart._id , active : true ,service_type : serviceName}).populate('product_id');

    res.status(200).json(orderItems);
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
};

  
exports.createOrderItem = async (req, res) => {
    try {
      const { clientId, productId, quantity, selectedItems,serviceName } = req.body;
  
      // Step 1: Find the cart for the given user (client_id)
      const cart = await Cart.findOne({ client_id: clientId });
  
      if (!cart) {
        return res.status(404).json({ error: 'Cart not found for this user' });
      }
  
      // Step 2: Find the product details
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Step 3: Calculate the total price including selected options
      let totalPrice = product.price * quantity;
  
      selectedItems.forEach(option => {
        totalPrice += option.price * quantity;
      });
  
      // Step 4: Create a new order item
      const newOrderItem = new OrderItem({
        Order_id: null,
        product_id: productId,
        cart_id: cart._id,
        quantity,
        price: totalPrice,
        service_type: serviceName,
        selected_options: selectedItems,
      });
  
      // Save the order item to the database
      await newOrderItem.save();
  
      res.status(201).json(newOrderItem);
    } catch (error) {
      console.error('Error creating order item:', error);
      res.status(500).json({ error: 'Failed to create order item' });
    }
  };
  
// Update an order item
exports.updateOrderItem = async (req, res) => {
    try {
        const { quantity, price } = req.body;
        const orderItem = await OrderItem.findByIdAndUpdate(req.params.id, { quantity, price }, { new: true });

        if (!orderItem) {
            return res.status(404).json({ error: 'Order item not found' });
        }

        res.status(200).json(orderItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update order item' });
    }
};

// Delete an order item
exports.deleteOrderItem = async (req, res) => {
    try {
        const orderItem = await OrderItem.findByIdAndDelete(req.params.id);
        if (!orderItem) {
            return res.status(404).json({ error: 'Order item not found' });
        }
        res.status(200).json({ message: 'Order item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete order item' });
    }
};


exports.updateOrderItems = async (req, res) => {
  const {  items } = req.body; // Expecting orderId and list of items from the request body
  console.log('Request Body:', req.body);

  try {
      // Loop through each item from the request body
      for (let item of items) {
          const { _id, free , quantity } = item;
          // Find the order item by its ID and update the isFree field
          const updatedOrderItem = await OrderItem.findByIdAndUpdate(
              _id,
              { isFree: free , quantity :quantity  }, // Update the isFree value
              { new: true } // Return the updated document
          );

          if (!updatedOrderItem) {
              console.log(`OrderItem with id ${_id} not found`);
          } else {
              console.log(`OrderItem with id ${_id} updated successfully`);
          }
      }

      return res.status(200).json({
          message: "Order items updated successfully"
      });

  } catch (error) {
      console.error('Error updating order items:', error);
      return res.status(500).json({ message: "Error updating order items", error });
  }
};
