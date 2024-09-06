// controllers/ChatController.js

const Admin = require('../models/Admin');
const ChatSupport = require('../models/ChatSupport');
const Client = require('../models/Client');
const Driver = require('../models/Driver');


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



exports.handleChatInitiation = async ({ adminId, userId, userType, socket }) =>{
  try {
    let chat = null;

    if (userType === 'Admin') {
        // First, try to find the user in the Client collection
        const client = await Client.findOne({ user_id: userId });
        console.log(client);

        if (client) {
            // If found in Client, check for existing chat between admin and client
            chat = await ChatSupport.findOne({ admin_id: adminId, client_id: client._id });
            if (!chat) {
                // If no chat exists, create a new one
                chat = new ChatSupport({
                    admin_id: adminId,
                    client_id: client._id,
                    messages: []
                });
                await chat.save();
            }
        } else {
            // If not found in Client, try to find the user in the Driver collection
            const driver = await Driver.findOne({ user_id: userId });

            if (driver) {
                // If found in Driver, check for existing chat between admin and driver
                chat = await ChatSupport.findOne({ admin_id: adminId, client_id: driver._id }); // Assuming client_id is used for drivers too
                if (!chat) {
                    // If no chat exists, create a new one
                    chat = new ChatSupport({
                        admin_id: adminId,
                        client_id: driver._id, // Storing driver._id in client_id for simplicity
                        messages: []
                    });
                    await chat.save();
                }
            } else {
                // If not found in both collections, throw an error
                throw new Error('User not found in Client or Driver collections');
            }
        }
    } else {
        // For non-admin users, find the chat as usual (assuming userId is always the clientId here)
        chat = await ChatSupport.findOne({ admin_id: adminId, client_id: userId });

        if (!chat) {
            // If no chat exists, create a new one
            chat = new ChatSupport({
                admin_id: adminId,
                client_id: userId,
                messages: []
            });
            await chat.save();
        }
    }

    // Join the room for this specific chat
    socket.join(chat._id.toString());

    // Emit all messages to the client/driver
    socket.emit('chatDetails', { chatId: chat._id, messages: chat.messages });

} catch (error) {
    console.error('Error initiating chat:', error);
    socket.emit('error', { message: 'Error initiating chat: ' + error.message });
}
}



exports.handleSendMessage = async ({ chatId, sender, content, io }) => {
  try {
    const chat = await ChatSupport.findById(chatId);
    if (!chat) {
      console.log(`Chat not found for chatId: ${chatId}`);
      return;
    }

    // Add the new message to the chat
    const newMessage = {
      sender,
      content,
      timestamp: new Date(),
    };
    chat.messages.push(newMessage);
    await chat.save();

    // Emit the new message to everyone in the chat room
    io.to(chatId).emit('newMessage', { message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Socket event listener
