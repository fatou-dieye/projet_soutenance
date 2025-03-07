
// controllers/historiqueController
const Utilisateur = require('../models/Utilisateur');
const HistoriqueAction = require('../models/HistoriqueAction');




// Fonction pour enregistrer l'action
const enregistrerAction = async (adminId, action, cibleId, details = '') => {
  try {
    const nouvelleAction = new HistoriqueAction({
      adminId,
      action,
      cibleId,
      details
    });
    await nouvelleAction.save();
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'historique :", error);
  }
};

module.exports = {
  enregistrerAction
};



/* Lister l'historique
 const getHistorique = async (req, res) => {
  try {
    const historique = await HistoriqueAction.find()
      .populate('adminId', 'nom email')
      .populate('cibleId', 'nom email')
      .sort({ date: -1 });

    res.json(historique);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique', error: error.message });
  }
}; 

module.exports = {
 
 getHistorique    
};

*/

