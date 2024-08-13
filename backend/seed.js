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
    const users = [];
    for (let i = 0; i < 6; i++) {
      users.push(new User({
        firstName: `User${i + 1}`,
        lastName: `Test${i + 1}`,
        deviceId: `Device${i + 1}`,
        phone: 123456789 + i,
        userType: 'Client',
        activated: true,
      }));
    }
    await User.insertMany(users);
    console.log('6 Users inserted');

    // 6 Adresses
    const addresses = [];
    for (let i = 0; i < 6; i++) {
      addresses.push(new Address({
        user_id: users[i]._id,
        address_line: `123 Test St Apt ${i + 1}`,
        building: `Building ${i + 1}`,
        floor: `${i + 1}`,
        door_number: `D${i + 1}`,
        digicode: `DC${i + 1}`,
        comment: `Comment ${i + 1}`,
      }));
    }
    await Address.insertMany(addresses);
    console.log('6 Addresses inserted');

    // 6 Produits
    const products = [];
    for (let i = 0; i < 6; i++) {
      products.push(new Product({
        name: `Product ${i + 1}`,
        description: `Description for product ${i + 1}`,
        price: 10 + i,
        image_url: `http://example.com/product${i + 1}.jpg`,
        service_type: 'food',
        is_active: true,
        options: [
          { name: 'Extra Cheese', price: 1 },
          { name: 'Extra Sauce', price: 0.5 },
        ],
      }));
    }
    await Product.insertMany(products);
    console.log('6 Products inserted');

    // 6 OrderItems
    const orderItems = [];
    for (let i = 0; i < 6; i++) {
      orderItems.push(new OrderItem({
        product_id: products[i]._id,
        cart_id: new mongoose.Types.ObjectId(),  // Utilisation d'un ObjectId généré
        quantity: i + 1,
        price: 10 + i,
        selected_options: [
          { name: 'Extra Cheese', price: 1 },
          { name: 'Extra Sauce', price: 0.5 },
        ],
      }));
    }
    await OrderItem.insertMany(orderItems);
    console.log('6 OrderItems inserted');

    // 6 Commandes
    const orders = [];
    for (let i = 0; i < 6; i++) {
      orders.push(new Order({
        OrderItem_id: orderItems[i]._id,
        client_id: users[i]._id,
        driver_id: null, // No driver for now
        address_id: addresses[i]._id,
        status: 'pending',
        total_price: 20 + i,
        payment_method: 'cash',
      }));
    }
    await Order.insertMany(orders);
    console.log('6 Orders inserted');

    // 6 Drivers
    const drivers = [];
    for (let i = 0; i < 6; i++) {
      drivers.push(new Driver({
        user_id: users[i]._id,
        additional_driver_info: `Additional info for driver ${i + 1}`,
      }));
    }
    await Driver.insertMany(drivers);
    console.log('6 Drivers inserted');

    // 6 Referrals
    const referrals = [];
    for (let i = 0; i < 6; i++) {
      referrals.push(new Referral({
        referrer_id: users[i]._id,
        referee_id: users[(i + 1) % 6]._id,
        points_earned: 10 * (i + 1),
      }));
    }
    await Referral.insertMany(referrals);
    console.log('6 Referrals inserted');

    console.log('Database seeding completed');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
