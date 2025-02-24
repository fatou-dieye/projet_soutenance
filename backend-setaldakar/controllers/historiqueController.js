const mongoose = require('mongoose');

// Schéma pour les actions des utilisateurs
const userActionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const UserAction = mongoose.model('UserAction', userActionSchema);

// Fonction pour enregistrer une action
async function logAction(userId, action) {
    try {
        const userAction = new UserAction({ userId, action });
        await userAction.save();
        console.log(`Action enregistrée : ${action} pour l'utilisateur ${userId}`);
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'action :', error);
    }
}

module.exports = {
    logAction
};
