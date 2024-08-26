const fetch = require('node-fetch');

const sendPushNotification = async () => {
  const message = {
    to: 'ExponentPushToken[XGZPzVDmZznszS2vQadxRt]', // Remplace par ton token Expo
    sound: 'default',
    title: 'Test Notification',
    body: 'Ceci est une notification de test !',
    data: { someData: 'Test data' },
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  const responseData = await response.json();
  console.log(responseData);
};

sendPushNotification();
