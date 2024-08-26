const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

// Get all users
router.get('/', userController.getAllUsers);

// Get a user by ID
router.get('/:id', userController.getUserById);

// Create a new user
router.post('/', userController.createUser);

// Update a user
router.put('/:id', userController.updateUser);

// Delete a user
router.delete('/:id', userController.deleteUser);

router.delete('/:id', userController.deleteUser);

router.post('/login', userController.loginUser);

router.post('/update-points', userController.updateUserPoints);


module.exports = router;
