const express = require("express");
const router = express.Router();
const adminAuth = require('./middlewares/adminAuth');

const {
    getUsers,
    getUserById,
    saveUser,
    updateUser,
    deleteUser
} = require('../controllers/UserController.js')



router.get('/Users', adminAuth, getUsers);
router.get('/Users/:id', adminAuth, getUserById);
router.post('/Users', adminAuth, saveUser);
router.patch('/Users/:id', adminAuth, updateUser);
router.delete('/Users/:id', adminAuth, deleteUser);

module.exports = router