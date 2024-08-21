const mongoose = require('mongoose');
const Service = require('./models/Service'); // Adjust the path to your Service model

// Connect to MongoDB
mongoose.connect('mongodb+srv://saadi0mehdi:1cmu7lEhWPTW1vGk@cluster0.whkh7vj.mongodb.net/ExpressApp?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Array of services to insert
const services = [
  { name: 'Service coursier', image: 'https://example.com/drinks.png', test: true },
  { name: 'J’ai faim', image: 'https://example.com/package.png', test: false },
  { name: 'Petits plaisirs', image: 'https://example.com/food.png', test: true },
  { name: 'Boutique cadeaux', image: 'https://example.com/coca-cola.png', test: true },
  { name: 'Marché', image: 'https://example.com/supermarket.png', test: true },
];

// Insert services into the database
const insertServices = async () => {
  try {
    await Service.insertMany(services);
    console.log('Services inserted successfully');
  } catch (err) {
    console.error('Error inserting services:', err);
  } finally {
    mongoose.connection.close();
  }
};

// Run the insertion script
insertServices();
