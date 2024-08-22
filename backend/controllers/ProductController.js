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
        const updatedProducts = await Product.find({ is_active: true });
        socket.emit('activeProducts', updatedProducts);
      } else if (change.operationType === 'insert') {
        // When a product is inserted, refetch and emit the active products
        const newProducts = await Product.find({ is_active: true });
        socket.emit('activeProducts', newProducts);
      } else if (change.operationType === 'delete') {
        // When a product is deleted, refetch and emit the active products
        const remainingProducts = await Product.find({ is_active: true });
        socket.emit('activeProducts', remainingProducts);
      }
    });
  } catch (err) {
    // Handle errors by emitting an error message via socket
    socket.emit('error', { message: 'Failed to retrieve products', error: err });
  }
};

