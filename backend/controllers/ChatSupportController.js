// controllers/ChatController.js

const ChatSupport = require('../models/ChatSupport');

exports.initiateChat = async (req, res) => {
  const { admin_id, client_id } = req.body;

  try {
    const existingChat = await ChatSupport.findOne({ admin_id, client_id });

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    const newChat = new ChatSupport({ admin_id, client_id });
    await newChat.save();

    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  const { chatId, sender, content } = req.body;

  try {
    const chat = await ChatSupport.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    chat.messages.push({ sender, content });
    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getChatHistory = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await ChatSupport.findById(chatId)
      .populate('admin_id')
      .populate('client_id');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markSeenFA = async (req, res) => {
  const { chatId } = req.body; // Expecting chatId in the request body

  try {
    // Find the chat by ID
    const chat = await ChatSupport.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Loop through the messages and mark client messages as seen
    chat.messages.forEach((message) => {
      if (message.sender === 'client' && !message.seen) {
        message.seen = true;
      }
    });

    // Save the updated chat
    await chat.save();

    return res.status(200).json({ message: 'All client messages marked as seen', messages: chat.messages });
  } catch (error) {
    return res.status(500).json({ error: 'Error marking messages as seen' });
  }
};

exports.markSeenFC = async (req, res) => {
  const { chatId } = req.body; // Expecting chatId in the request body

  try {
    // Find the chat by ID
    const chat = await ChatSupport.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Loop through the messages and mark client messages as seen
    chat.messages.forEach((message) => {
      if (message.sender === 'admin' && !message.seen) {
        message.seen = true;
      }
    });

    // Save the updated chat
    await chat.save();

    return res.status(200).json({ message: 'All client messages marked as seen', messages: chat.messages });
  } catch (error) {
    return res.status(500).json({ error: 'Error marking messages as seen' });
  }
};