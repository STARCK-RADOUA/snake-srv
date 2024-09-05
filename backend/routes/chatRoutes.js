// routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/ChatSupportController');

router.post('/initiate', chatController.initiateChat);
router.post('/send-message', chatController.sendMessage);
router.get('/:chatId', chatController.getChatHistory);
router.post('/mark-seenFA', chatController.markSeenFA);
router.post('/mark-seenFc', chatController.markSeenFC);


module.exports = router;
