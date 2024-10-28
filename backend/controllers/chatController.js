const Chat = require('../models/Chat');
const Client = require('../models/Client');
const Driver = require('../models/Driver');
const Order = require('../models/Order');
const User = require('../models/User');
const notificationController = require('./notificationController');

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
    console.log(`Received sendMessages event for chatId: ${chatId}, sender: ${sender}, content: ${content}`);

    // Find the chat by chatId
    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log(`Chat not found for chatId: ${chatId}`);
      io.to(chatId).emit('error', { message: 'Chat not found' }); // Corrected this line
      return;
    }

    // Add the new message to the chat
    const newMessage = { sender, content, timestamp: new Date() };
    chat.messages.push(newMessage);
    await chat.save();
    console.log('New message added to chat:', newMessage);

    // Emit the new message to all clients in this chat room
    io.to(chatId).emit('newMessages', { message: newMessage });
   
    let driver1 = await Driver.findById(chat.driver_id);
    let client1 = await Client.findById(chat.client_id);
    console.log('Driver:', driver1);

 

    console.log(driver1 , "dvv")
    const userdriver = await User.findOne(driver1.user_id);
    const userClient = await User.findOne(client1.user_id);
    console.log(userdriver , "dv")
    

    let deviceId = userdriver.deviceId;
    let deviceIdclient = userClient.deviceId;
  const order = await Order.findOne(chat.order_id)
  console.log("zrzerf      device id client        "+deviceIdclient)
  let orderId = order._id ;
  console.log("zrzerf" , orderId , order)

  await this.watchOrderMessagesForDriver({ io, deviceId });
  await this.watchOrderMessagesForClient({ io, orderId,deviceIdclient });


if(sender === 'client'){

 const name = "new message"; // Personnalisez le nom
  const title = "🔔 Nouveau Message Client 📨";
  const message = `Vous avez reçu un nouveau message de votre client.
  📍 Veuillez le consulter et répondre si nécessaire.`;
  // Titre de la notification
  const userType = "Driver"; // Type d'utilisateur (client)

  await notificationController.sendNotificationForce(name, userdriver.pushToken, message, title, userType);



}else if(sender ==='driver'){
  const name = "new message"; // Personnalisez le nom

  const title = "🔔 Nouveau Message de votre Livreur 🛵";
  const message = `Votre livreur vous a envoyé un nouveau message.
  📍 Consultez-le pour suivre l'état de votre livraison.`;
  
  // Titre de la notification
  const userType = "Client"; // Type d'utilisateur (client)

  await notificationController.sendNotificationForce(name, userClient.pushToken, message, title, userType);


}




    console.log(`Emitted newMessages event for chatId: ${chatId}`);

  } catch (error) {
    console.error('Error sending message:', error);
    io.to(chatId).emit('error', { message: 'Failed to send message' }); // Corrected this line
  }
};




exports.handleChatInitiationDC = async ({ orderId, clientId, driverId, socket }) => {
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



exports.watchOrderMessages = async ({ socket }) => {
  try {
    // Fetch all chat supports and populate related fields
    const chats = await Chat.find().populate('client_id').populate('driver_id').populate('order_id');

    if (chats) {
      const lastMessages = await Promise.all(chats.map(async (chat) => {
        const lastMessage = chat.messages[chat.messages.length - 1]; // Get the last message
        let clientFullName = '';
        let driverFullName = '';
        let clientId = '';
        let driverId = '';

        // Fetch client details
        const clientObj = await Client.findById(chat.client_id);
        if (clientObj) {
          const clientUser = await User.findById(clientObj.user_id);
          if (clientUser) {
            clientFullName = `${clientUser.firstName} ${clientUser.lastName}`;
            clientId = clientUser._id; // Get the clientId
          }
        }

        // Fetch driver details
        const driverObj = await Driver.findById(chat.driver_id);
        if (driverObj) {
          const driverUser = await User.findById(driverObj.user_id);
          if (driverUser) {
            driverFullName = `${driverUser.firstName} ${driverUser.lastName}`;
            driverId = driverUser._id; // Get the driverId
          }
        }

        // Fetch order status
        const orderStatus = chat.order_id ? chat.order_id.status : 'Unknown';

        return {
          chatId: chat._id,        // Include chat ID
          orderId: chat.order_id._id,
          orderStatus,
          clientFullName,
          driverFullName,
          clientId,                // Include clientId
          driverId,                // Include driverId
          lastMessage,
          chatCreatedAt: chat.createdAt,
        };
      }));

      // Filter out any null results
      const validMessages = lastMessages.filter(msg => msg !== null);

      // Emit the last messages to the client
      socket.emit('OrderchatMessagesUpdated', { messages: validMessages });
    }
  } catch (error) {
    console.error('Error finding or watching chats:', error);
  }
};


exports.watchOrderMessagesForDriver = async ({ io, deviceId }) => {
  console.log('Driver hk:', deviceId);

  // Fetch the user based on device ID
  const user = await User.findOne({ deviceId, userType: 'Driver' });
  console.log('User:', user);
  if (!user) {
    console.error('User not found for device ID:', deviceId);
    return;
  }
  const driver = await Driver.findOne({ user_id: user._id });
  console.log(driver, "didi")

  if (!driver) {
    console.error('Driver not found for user ID:', user._id);
    return;
  }

  try {
    // Fetch all chat supports and populate related fields
    const chats = await Chat.find({ driver_id: driver._id }).populate('client_id').populate('driver_id').populate('order_id');
    console.log(chats, "chichi")
    if (chats) {
      const lastMessages = await Promise.all(chats.map(async (chat) => {
        const lastMessage = chat.messages[chat.messages.length - 1]; // Get the last message
        let clientFullName = '';
        let driverFullName = '';
        let clientId = '';
        let driverId = '';

        // Fetch client details
        const clientObj = await Client.findById(chat.client_id);
        if (clientObj) {
          const clientUser = await User.findById(clientObj.user_id);
          if (clientUser) {
            clientFullName = `${clientUser.firstName} ${clientUser.lastName}`;
            clientId = clientUser._id; // Get the clientId
          }
        }

        // Fetch driver details
        const driverObj = await Driver.findById(chat.driver_id);
        if (driverObj) {
          const driverUser = await User.findById(driverObj.user_id);
          if (driverUser) {
            driverFullName = `${driverUser.firstName} ${driverUser.lastName}`;
            driverId = driverUser._id; // Get the driverId
          }
        }

        // Fetch order status
        const orderStatus = chat.order_id ? chat.order_id.status : 'Unknown';

        return {
          chatId: chat._id,        // Include chat ID
          orderId: chat.order_id._id,
          orderStatus,
          clientFullName,
          driverFullName,
          clientId,                // Include clientId
          driverId,                // Include driverId
          lastMessage,
          chatCreatedAt: chat.createdAt,
        };
      }));

      // Filter out any null results
      const validMessages = lastMessages.filter(msg => msg !== null);
      console.log(validMessages, "gfg")

      // Emit the last messages to the client
      io.to(deviceId).emit('OrderchatMessagesDriverUpdated', { messages: validMessages });
    }
  } catch (error) {
    console.error('Error finding or watching chats:', error);
  }
};




exports.watchOrderMessagesForClient = async ({ io, orderId,deviceIdclient }) => {
  console.log("yeds" , orderId)

  try {
    // Fetch all chat supports and populate related fields
    const chats = await Chat.find({ order_id : orderId}).populate('client_id').populate('driver_id').populate('order_id');
    console.log(chats, "chichi")
    if (chats) {
      const lastMessages = await Promise.all(chats.map(async (chat) => {
        const lastMessage = chat.messages[chat.messages.length - 1]; // Get the last message
        let driverFullName = '';
     
        // Fetch driver details
        const driverObj = await Driver.findById(chat.driver_id);
        if (driverObj) {
          const driverUser = await User.findById(driverObj.user_id);
          if (driverUser) {
            driverFullName = `${driverUser.firstName} ${driverUser.lastName}`;
            driverId = driverUser._id; // Get the driverId
          }
        }

        // Fetch order status
        const orderStatus = chat.order_id ? chat.order_id.status : 'Unknown';

        return {
          chatId: chat._id,        // Include chat ID
          orderId: chat.order_id._id,
          orderStatus,
          driverFullName,
          lastMessage,
          chatCreatedAt: chat.createdAt,
        };
      }));

      // Filter out any null results
      const validMessages = lastMessages.filter(msg => msg !== null);

      console.log(validMessages, "dzdzdzd")
      console.log(orderId, "ghghg")

      // Emit the last messages to the client
      io.to(deviceIdclient).emit('OrderchatMessagesClientUpdated', { messages: validMessages });
    }
  } catch (error) {
    console.error('Error finding or watching chats:', error);
  }
};



exports.joinOrderMessage = async ({ socket, chatId }) => {
  try {
    console.log(`Joining existing chat with chatId: ${chatId}`);

    // Find the chat by chatId
    const chat = await Chat.findById(chatId).populate('client_id').populate('driver_id');
    if (!chat) {
      console.log(`No chat found with chatId: ${chatId}`);
      socket.emit('error', { message: 'No chat found' });
      return;
    }

    // Join the room for this specific chat
    socket.join(chat._id.toString());
    console.log(`Socket joined room for chatId: ${chat._id}`);

    // Send the existing chat details to the client
    socket.emit('chatDetailss', { chatId: chat._id, messages: chat.messages });
    console.log('Emitted chatDetailss event with messages:', chat.messages.length);
  } catch (error) {
    console.error('Error joining chat:', error);
    socket.emit('error', { message: 'Failed to join chat' });
  }
};


exports.markSeenFD = async (req, res) => {
  const { chatId } = req.body; // Expecting chatId in the request body

  try {
    // Find the chat by ID
    const chat = await Chat.findById(chatId);

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



exports.markSeenFCC = async (req, res) => {
  const { orderId } = req.body; // Expecting chatId in the request body

  try {
    let chat = await Chat.findOne({ order_id: orderId });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Loop through the messages and mark client messages as seen
    chat.messages.forEach((message) => {
      if (message.sender === 'driver' && !message.seen) {
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