const Historique = require('../models/historique'); // Assurez-vous que le chemin est correct

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



module.exports = { enregistrerAction };
