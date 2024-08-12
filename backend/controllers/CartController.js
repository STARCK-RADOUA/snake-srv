const Cart = require('../models/Cart');
const mongoose = require('mongoose');

// Create a new cart
exports.createCart = async (req, res) => {
  try {
    const { client_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(client_id)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    const newCart = new Cart({ client_id });
    await newCart.save();

    res.status(201).json(newCart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create cart' });
  }
};

// Get all carts
exports.getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find().populate('client_id');
    res.status(200).json(carts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch carts' });
  }
};

// Get a cart by ID
exports.getCartById = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.id).populate('client_id');

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

// Update a cart
exports.updateCart = async (req, res) => {
  try {
    const { client_id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(client_id)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    const cart = await Cart.findByIdAndUpdate(req.params.id, { client_id }, { new: true });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
};

// Delete a cart
exports.deleteCart = async (req, res) => {
  try {
    const cart = await Cart.findByIdAndDelete(req.params.id);

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    res.status(200).json({ message: 'Cart deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete cart' });
  }
};
