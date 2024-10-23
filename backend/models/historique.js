const mongoose = require('mongoose');
const { Schema } = mongoose;

const historiqueSchema = new Schema({
    actionType: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    utilisateurId: {
        type: Schema.Types.ObjectId,
        ref: 'Utilisateur',
        required: true
    },
    dateAction: {
        type: Date,
        default: Date.now
    },
    location: {
        type: String,
    },
    objetType: {
        type: String,
        default: ''
    }
});

const Historique = mongoose.model('Historique', historiqueSchema);

module.exports = Historique;
