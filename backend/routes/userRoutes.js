const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

// Get all users
router.get('/', userController.getAllUsers);
router.get('/clients', userController.getClients);
router.get('/drivers', userController.getDrivers);
router.get('/all', userController.getAllUsersForAdmin);


// Get a user by ID
router.get('/:id', userController.getUserById);

// Create a new user
router.post('/', userController.createUser);

router.post('/clients/:clientId/activate', userController.activateDeactivateClient);
router.post('/clients/:clientId/toggle-login', userController.toggleLoginStatus);
router.post('/driver/:clientId/activate', userController.activateDeactivateDriver);
router.post('/driver/:clientId/toggle-login', userController.toggleLoginStatusD);
router.post('/driver/add', userController.addDriver);


// Update a user
router.put('/:id', userController.updateUser);

router.put('/update/:id', userController.updateTheDriver);


// Delete a user
router.delete('/:id', userController.deleteUser);

router.delete('/:id', userController.deleteUser);

router.post('/login', userController.loginUser);

router.post('/update-points', userController.updateUserPoints);
router.post('/validate-password', userController.validatePass);
router.post('/change-phone', userController.changeNumber);

router.post('/change-password', userController.changePass);

router.post('/change-name', userController.changeName);



module.exports = router;
