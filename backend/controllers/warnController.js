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
