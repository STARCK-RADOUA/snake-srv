const ChatSupport = require('../models/Chat');

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
