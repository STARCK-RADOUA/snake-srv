// controllers/ChatController.js

const Admin = require('../models/Admin');
const ChatSupport = require('../models/ChatSupport');
const Client = require('../models/Client');
const Driver = require('../models/Driver');
const User = require('../models/User');


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



exports.handleSendMessage = async ({ chatId, sender, content, deviceId,  io }) => {
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
    if (sender === "admin") {
      console.log("Sender is admin");
      try {
        console.log("de" , deviceId)
            await this.watchSupportMessagesForDriver({ socket: io , deviceId });

      } catch (error) {
        console.error('Error in watchMessages:', error);
      }
    } else {
     
        console.log("Handling non-admin message with deviceId:", deviceId);
        try {
          await this.watchMessages({ socket: io });
        } catch (error) {
          console.error('Error in watchSupportMessagesForDriver:', error);
        }
      
    }
    // Emit the new message to everyone in the chat room
    io.to(chatId).emit('newMessage', { message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Socket event listener


exports.watchMessages = async ({socket}) => {
  try {
    // Fetch all chat supports
    const chats = await ChatSupport.find().populate('client_id').populate('admin_id');

    if (chats) {
      const lastMessages = await Promise.all(chats.map(async (chat) => {
        const lastMessage = chat.messages[chat.messages.length - 1]; // Get the last message
        if (lastMessage) {
          const cliento = await Client.findById(chat.client_id);
          if (cliento) {
            const client = await User.findById(cliento.user_id )
            return {
              clientId: client._id, // Include the clientId
              clientFullName: `${client.firstName} ${client.lastName}`,
              userType: client.userType,
              role : "client",
              lastMessage,
            };
          }else{
            const bb = await Driver.findById(chat.client_id);
            console.log(bb)
            const client = await User.findById(bb.user_id )
            return {
              clientId: client._id, // Include the clientId
              clientFullName: `${client.firstName} ${client.lastName}`,
              userType: client.userType,
              role :"driver" ,
              lastMessage,
            };
          }
        }
        return null;
      }));

      // Filter out any null results
      const validMessages = lastMessages.filter(msg => msg !== null);

      // Emit the last messages to the client
      socket.emit('chatMessagesUpdated', { messages: validMessages });
    }
  } catch (error) {
    console.error('Error finding or watching chats:', error);
  }
};


exports.watchSupportMessagesForDriver = async ({ socket, deviceId }) => {
  try {
    console.log('Driver Device ID:', deviceId);

    // Fetch the user based on device ID
    const user = await User.findOne({ deviceId });
    console.log('User:', user);

    if (!user) {
      console.error('User not found for device ID:', deviceId);
      return;
    }

    // Try to find driver or client based on the user
    let userCD = await Driver.findOne({ user_id: user._id });
    console.log('Driver:', userCD);

    if (!userCD) {
      userCD = await Client.findOne({ user_id: user._id });
      console.log('Client:', userCD);
    }

    if (!userCD) {
      console.error('Neither driver nor client found for user ID:', user._id);
      return;
    }

    // Fetch chats related to the user (driver or client)
    const chats = await ChatSupport.find({ client_id: userCD._id })
      .populate('client_id')
      .populate('admin_id');

    if (!chats || chats.length === 0) {
      console.log('No chats found for client/driver ID:', userCD._id);
      return;
    }

    // Extract last messages from each chat
    const lastMessages = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = chat.messages[chat.messages.length - 1]; // Get the last message
        if (lastMessage) {
          return { lastMessage };
        }
        return null;
      })
    );

    // Filter out null messages
    const validMessages = lastMessages.filter((msg) => msg !== null);

    if (validMessages.length > 0) {
      // Emit the last messages to the client
      socket.emit('SupportchatMessagesUpdatedForDriver', { messages: validMessages });
    } else {
      console.log('No valid messages found for client/driver ID:', userCD._id);
    }
  } catch (error) {
    console.error('Error while watching support messages for driver:', error);
  }
};
