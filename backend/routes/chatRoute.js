const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Get all chats
router.get('/', chatController.getAllChats);

// Get a chat by ID
router.get('/:id', chatController.getChatById);

// Create a new chat
router.post('/', chatController.createChat);

// Update a chat
router.put('/:id', chatController.updateChat);

// Delete a chat
router.delete('/:id', chatController.deleteChat);

module.exports = router;
