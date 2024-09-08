const axios = require('axios');

// Your Expo Push Token
const expoPushToken = 'ExponentPushToken[GMMI84HNPcA41y5S_I489v]'; // Replace with a real token

// Function to send the test notification
async function sendPushNotification() {
  const message = {
    "to": expoPushToken,
    "sound": "default",
    "title": "Test Notification",
    "body": "This is a test notification",
    "data": {
      "targetScreen": "DriverOrdersScreen"
    }
  }
  

  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', message);


    console.log('Notification sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error.response ? error.response.data : error.message);
  }
}

sendPushNotification();
