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
    
    console.log('Received clientId (backend):', clientId); // Check the value of clientId here

    if (!clientId) {
      return res.status(400).json({ error: 'clientId is missing in the request' });
    }

    const cart = await Cart.findOne({ client_id: clientId });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found for this user' });
    }

    const orderItems = await OrderItem.find({ cart_id: cart._id }).populate('product_id');

    res.status(200).json(orderItems);
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
};

  
exports.createOrderItem = async (req, res) => {
    try {
      const { clientId, productId, quantity, selectedItems } = req.body;
  
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
