const Product = require('../models/Product');

exports.sendActiveProducts = async (socket) => {
  try {
    const products = await Product.find({ is_active: true });
    socket.emit('activeProducts', products);
  } catch (err) {
    socket.emit('error', { message: 'Failed to retrieve products', error: err });
  }
};
