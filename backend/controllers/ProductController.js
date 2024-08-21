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
    const products = await Product.find({ is_active: true ,service_type:serviceName});
    socket.emit('activeProducts', products);
  } catch (err) {
    socket.emit('error', { message: 'Failed to retrieve products', error: err });
  }
};
