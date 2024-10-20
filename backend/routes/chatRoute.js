// routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/initiate', chatController.initiateChat);
router.post('/send-message', chatController.sendMessage);
router.get('/:chatId', chatController.getChatHistory);
router.post('/mark-seenFD', chatController.markSeenFD);
router.post('/mark-seenFCC', chatController.markSeenFCC);

module.exports = router;
