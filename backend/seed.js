const mongoose = require('mongoose');
const User = require('./models/User'); 
const Driver = require('./models/Driver');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const Product = require('./models/Product');
const Address = require('./models/Address');
const Referral = require('./models/Referral');

mongoose.connect('mongodb+srv://saadi0mehdi:1cmu7lEhWPTW1vGk@cluster0.whkh7vj.mongodb.net/ExpressApp?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});

async function seed() {
  try {
    // Génération des objets de test pour chaque modèle

    // 6 Utilisateurs

    // 6 Adresses


    // 6 Produits
    const products = [];
    for (let i = 0; i < 6; i++) {
      products.push(new Product({
        name: `Product ${i + 5}`,
        description: `Description for product ${i + 1}`,
        price: 10 + i,
        image_url: `http://example.com/product${i + 1}.jpg`,
        
        is_active: true,
        
        service_type: "J’ai faim",
        options: [
          { name: 'Extra Cheese', price: 1 },
          { name: 'Extra Sauce', price: 0.5 },
        ],
      }));
    }
    await Product.insertMany(products);
    console.log('6 Products inserted');

   

  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
