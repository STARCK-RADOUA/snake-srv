const Product = require('../models/Product');

exports.addProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();

    // Émettre l'événement pour informer les clients connectés qu'un nouveau produit a été ajouté
    req.io.emit('newProduct', newProduct);

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add product', error: err });
  }
};
exports.sendActiveProducts = async (socket,serviceName) => {
  try {
    // Fetch all active products when the connection is established
    const products = await Product.find({ is_active: true ,service_type:serviceName} );
    socket.emit('activeProducts', products); // Emit current active products

    // Set up a change stream to watch for all changes in the Product collection
    const productStream = Product.watch();

    // Listen for changes (insert, update, delete) across the entire Product collection
    productStream.on('change', async (change) => {
      if (change.operationType === 'update') {
        // When a product is updated, refetch and emit the active products
        const updatedProducts = await Product.find({ is_active: true ,service_type:serviceName });
        socket.emit('activeProducts', updatedProducts);
      } else if (change.operationType === 'insert') {
        // When a product is inserted, refetch and emit the active products
        const newProducts = await Product.find({ is_active: true ,service_type:serviceName });
        socket.emit('activeProducts', newProducts);
      } else if (change.operationType === 'delete') {
        // When a product is deleted, refetch and emit the active products
        const remainingProducts = await Product.find({ is_active: true  ,service_type:serviceName });
        socket.emit('activeProducts', remainingProducts);
      }
    });
    
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

    res.status(200).json({ message: 'Product deleted successfully.', product: deletedProduct });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error. Could not delete product.' });
  }
};
