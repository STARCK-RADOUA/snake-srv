const Historique = require('../models/historique'); // Assurez-vous que le chemin est correct
const Client = require('../models/Client'); // Assurez-vous
// Fonction pour enregistrer une action dans l'historique
const enregistrerAction = async ({ actionType, description = '', utilisateurId, location = null, objetType = '' }) => {
    try {
        const action = new Historique({
            actionType,
            description,
            utilisateurId,
            location,
            objetType
        });

        await action.save();
        console.log('Action ////²²²²²²²²////enregistrée avec succès');
    } catch (err) {
        console.error('Erreur lors de l’enregistrement de l’action :', err);
    }
};
const getHistoriqueByUserId = async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`getHistoriqueByUserId`,userId);
      if (!userId) {
        return res.status(400).json({ error: 'userId is missing in the request' });
      }
  
      const historique = await Historique.find({
        utilisateurId: userId,
        actionType: "Connexion"
      }).sort({ dateAction: -1 });
      if (!historique) {
        return res.status(404).json({ error: 'Aucune action de connexion trouvée pour ce client' });
      }
      console.log('------------------------------------');
      console.log(historique);
      console.log('------------------------------------');
    
      res.status(200).json(historique);
    } catch (error) {
      console.error('Erreur lors de la récupération de l’historique:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };


module.exports = { enregistrerAction ,getHistoriqueByUserId};
