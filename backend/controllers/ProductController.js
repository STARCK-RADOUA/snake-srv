const Product = require('../models/Product');
const OrderItem = require('../models/OrderItem');

exports.addProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();

    // Émettre l'événement pour informer les clients connectés qu'un nouveau produit a été ajouté
    req.io.emit('newProduct', newProduct);
    io.emit('newactiveProducts', );
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add product', error: err });
  }
};
exports.sendActiveProducts = async (socket, serviceName) => {
  try {
    // Fetch all active products based on the service type
    const products = await Product.find({ is_active: true, service_type: serviceName });
    
    // Emit the active products back to the client
    socket.emit('activeProducts', { products });

    // Optional: Handle socket disconnection if needed
 

  } catch (err) {
    // Handle errors by emitting an error message via socket
    socket.emit('error', { message: 'Failed to retrieve products', error: err });
  }
};
exports.getProducts =  async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.addProductA = async (req, res) => {
  try {
    const newProduct = new Product(req.body); // Create a new Product instance using the request body data
    await newProduct.save(); // Save the new product to the database


    const { io } = require('../index');
    const products = await Product.find();
    io.emit('productsUpdated', { products });
    io.emit('newactiveProducts', );
    // Return the newly created product as a JSON response
    res.status(201).json(newProduct);

  } catch (err) {
    // Handle any errors and return a 500 status with the error message
    res.status(500).json({ message: 'Failed to add product', error: err });
  }
};


exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params; // Get product ID from the request params
    const updateData = req.body; // The updated product data from the client (React Native app)

    // Find the product by ID and update it with the new data
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData }, // Set the updated fields
      { new: true, runValidators: true } // Return the updated product, and run schema validators
    );

    // If the product is not found
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { io } = require('../index');
    const products = await Product.find();
    io.emit('productsUpdated', { products });
    io.emit('newactiveProducts', );
    // Send the updated product back to the client
    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
};





exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find the product by ID and delete it
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const { io } = require('../index');
    const products = await Product.find();
    io.emit('productsUpdated', { products });
    io.emit('newactiveProducts', );
    res.status(200).json({ message: 'Product deleted successfully.', product: deletedProduct });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error. Could not delete product.' });
  }
};



exports.getProductRevenueAndCountBetweenDates = async (req, res) => {
  try {
    // Step 1: Extract productId, startDate, and endDate from the request body or query parameters
    const { productId, startDate, endDate } = req.body; // Or req.query, depending on how you're sending data

    // Step 2: Convert the start and end dates to ISO format (if necessary)
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Step 3: Aggregate data from OrderItem to calculate revenue and total times bought for the specific product
    const orderItems = await OrderItem.aggregate([
      {
        $match: {
          product_id: productId, // Match the specific product by ID
          createdAt: { $gte: start, $lte: end }, // Match the order date between the startDate and endDate
          status: "delivered" // Only include orders that have been delivered
        }
      },
      {
        $group: {
          _id: "$product_id",
          totalTimesBought: { $sum: "$quantity" }, // Sum of quantities for the product
          totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } }, // Sum of revenue (price * quantity)
        }
      }
    ]);

    // Step 4: Check if there is data for the specified product in the given date range
    if (orderItems.length > 0) {
      // Return the total revenue and total times bought for the product
      res.json({
        productId,
        totalTimesBought: orderItems[0].totalTimesBought,
        totalRevenue: orderItems[0].totalRevenue
      });
    } else {
      // If no orders are found, return 0 values
      res.json({
        productId,
        totalTimesBought: 0,
        totalRevenue: 0
      });
    }

  } catch (error) {
    console.error('Error fetching product revenue and count:', error);
    res.status(500).json({ message: 'Error fetching product data' });
  }
};

