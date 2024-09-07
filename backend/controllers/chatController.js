const Chat = require('../models/Chat');

exports.initiateChat = async (req, res) => {
    const { driver_id, client_id, order_id } = req.body;

    console.log("Initiating chat with driver:", driver_id, "client:", client_id, "order:", order_id);

    try {
        const existingChat = await ChatSupport.findOne({ driver_id, client_id, order_id });
        if (existingChat) {
            console.log("Found existing chat:", existingChat);
            return res.status(200).json(existingChat);
        }

        const newChat = new ChatSupport({ driver_id, client_id, order_id });
        await newChat.save();
        console.log("Created new chat:", newChat);

        res.status(201).json(newChat);
    } catch (error) {
        console.error("Error initiating chat:", error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.sendMessage = async (req, res) => {
    const { chatId, sender, content } = req.body;

    console.log("Sending message in chat:", chatId, "from:", sender, "content:", content);

    try {
        const chat = await ChatSupport.findById(chatId);
        if (!chat) {
            console.error("Chat not found with ID:", chatId);
            return res.status(404).json({ error: 'Chat not found' });
        }

        chat.messages.push({ sender, content });
        await chat.save();
        console.log("Message saved:", chat.messages[chat.messages.length - 1]);

        res.status(200).json(chat);
    } catch (error) {
        console.error("Error sending message:", error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.getChatHistory = async (req, res) => {
    const { chatId } = req.params;
    const { order_id } = req.query; // Accept the order_id as a query parameter

    console.log("Fetching chat history for chat ID:", chatId, "and order ID:", order_id);

    try {
        const chat = await ChatSupport.findOne({ _id: chatId, order_id })
            .populate('driver_id')
            .populate('client_id');

        if (!chat) {
            console.error("Chat not found with ID:", chatId);
            return res.status(404).json({ error: 'Chat not found' });
        }

        console.log("Returning chat history:", chat);
        res.status(200).json(chat);
    } catch (error) {
        console.error("Error fetching chat history:", error.message);
        res.status(500).json({ error: error.message });
    }
};



exports.handleSendMessageCD = async ({ chatId, sender, content, io }) => {
    try {
        console.log(`Received sendMessages event for chatId: ${chatId}, sender: ${sender}, content: ${content}`); // Debugging log
  
        // Find the chat by chatId
        const chat = await Chat.findById(chatId);
        if (!chat) {
          console.log(`Chat not found for chatId: ${chatId}`); // Debugging log for missing chat
          socket.emit('error', { message: 'Chat not found' });
          return;
        }
  
        // Add the new message to the chat
        const newMessage = { sender, content, timestamp: new Date() };
        chat.messages.push(newMessage);
        await chat.save();
        console.log('New message added to chat:', newMessage); // Debugging log for added message
  
        // Emit the new message to all clients in this chat room
        io.to(chatId).emit('newMessages', { message: newMessage });
        console.log(`Emitted newMessages event for chatId: ${chatId}`); // Debugging log for emitted message
  
      } catch (error) {
        console.error('Error sending message:', error); // Error handling log
        socket.emit('error', { message: 'Failed to send message' });
      }
  };
  



  exports.handleChatInitiationDC = async ({ orderId, clientId, driverId , socket }) =>{
    try {
        console.log(`Received initiateChats event with orderId: ${orderId}, clientId: ${clientId}, driverId: ${driverId}`); // Debugging log
  
        // Check if a chat already exists for the given orderId between this driver and client
        let chat = await Chat.findOne({ order_id: orderId, client_id: clientId, driver_id: driverId });
        console.log('Chat found:', chat ? chat._id : 'No existing chat'); // Debugging log
  
        if (!chat) {
          // If no chat exists, create a new one
          console.log('Creating new chat for order:', orderId); // Debugging log for new chat creation
  
          chat = new Chat({
            order_id: orderId,
            driver_id: driverId,  // Get the driver ID from the frontend
            client_id: clientId,
            messages: []  // Initialize with an empty messages array
          });
          await chat.save();
          console.log('New chat created with ID:', chat._id); // Debugging log for saved chat
        }
        
        // Join the room for this specific chat
        socket.join(chat._id.toString());
        console.log(`Socket joined room for chatId: ${chat._id}`); // Debugging log for joining room
  
        // Send the existing chat details to the client
        socket.emit('chatDetailss', { chatId: chat._id, messages: chat.messages });
        console.log('Emitted chatDetailss event with messages:', chat.messages.length); // Debugging log for emitting chat details
  
      } catch (error) {
        console.error('Error initiating chat:', error); // Error handling log
        socket.emit('error', { message: 'Failed to initiate chat' });
      }
  }
  