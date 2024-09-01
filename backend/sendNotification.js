const axios = require('axios');

async function sendPushNotification() {
  const expoPushToken = 'ExponentPushToken[Mr7VYfFAoqx5iNNauZNJok]'; // Le token de l'administrateur
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Test Notification',
    body: 'This is a test notification sent to the admin!',
    data: { someData: 'goes here' },
  };

  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    console.log('Notification envoyée avec succès:', response.data);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error.response ? error.response.data : error.message);
  }
}

sendPushNotification();
