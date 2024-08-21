const mongoose = require('mongoose');
const Service = require('./models/Service'); // Adjust the path to your Service model

// Connect to MongoDB
mongoose.connect('mongodb+srv://saadi0mehdi:1cmu7lEhWPTW1vGk@cluster0.whkh7vj.mongodb.net/ExpressApp?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Array of services to insert
const services = [
  { name: ' coursier', image: 'https://.com/drinks.png', test: true },
  { name: ' faim', image: 'https://example.com/package.png', test: false },
  { name: ' plaisirs', image: 'https://.com/food.png', test: true },
  { name: ' cadeaux', image: 'https://example.com/coca-cola.png', test: false },

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
