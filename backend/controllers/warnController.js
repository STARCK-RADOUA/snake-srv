const Warn = require('../models/Warn');

exports.getAllWarns = async (req, res) => {
  try {
    const warns = await Warn.find(); // Récupère tous les documents Warn de la base de données

    // Émettre les données récupérées à tous les admins connectés
    const io = req.app.get('socketio');
    io.emit('warnsData', warns);

    res.status(200).json(warns);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Warns', error });
  }
};


exports.updateSeenWarns = async (req, res) => {
  try {
    const result = await Warn.updateMany({}, { seen: true });
    const { io } = require('../index');
    await this.watchwarnMessages({socket : io});

    res.status(200).json({ message: 'All warnings updated to seen.', result });
  } catch (error) {
    console.error('Error updating warnings:', error);
    res.status(500).json({ message: 'Failed to update warnings.' });
  }
};



exports.watchwarnMessages = async ({ socket }) => {
  try {
    // Fetch the latest Warn document
    const latestWarn = await Warn.findOne().sort({ created_at: -1 });

    if (latestWarn) {
      const warningData = {
        seen: latestWarn.seen,
        deviceId: latestWarn.deviceId,
        _id: latestWarn._id,
      };

      // Emit the latest warning data to the client who requested it
      socket.emit('newWarning', warningData);
    } else {
      socket.emit('newWarning', { message: 'No warnings found' });
    }
  } catch (error) {
    console.error('Error fetching the latest warning:', error);
    socket.emit('newWarning', { message: 'Error fetching the latest warning' });
  }
};
