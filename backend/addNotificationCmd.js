const mongoose = require('mongoose');
const Notification = require('./models/Notification'); // Assurez-vous que le chemin est correct

// Connexion à MongoDB
mongoose.connect('mongodb+srv://saadi0mehdi:1cmu7lEhWPTW1vGk@cluster0.whkh7vj.mongodb.net/ExpressApp?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  // Récupérer les arguments de la ligne de commande
  const [user_id, title, message] = process.argv.slice(2);

  if (!user_id || !title || !message) {
    console.error('Veuillez fournir user_id, title, et message en tant qu\'arguments.');
    mongoose.connection.close();
    process.exit(1);
  }

  const notification = new Notification({
    user_id: user_id,
    title: title,
    message: message,
    read_at: null, // Laisser null par défaut
  });

  try {
    await notification.save();
    console.log('Notification ajoutée avec succès:', notification);
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la notification:', error);
  } finally {
    mongoose.connection.close();
  }
});
