// routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/initiate', chatController.initiateChat);
router.post('/send-message', chatController.sendMessage);
router.get('/:chatId', chatController.getChatHistory);

module.exports = router;
