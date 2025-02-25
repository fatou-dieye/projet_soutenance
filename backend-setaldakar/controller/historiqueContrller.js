
// controllers/historiqueController
const Utilisateur = require('../models/utilisateur.model');
const HistoriqueAction = require('../models/HistoriqueAction');



  //partie historique
  //creation historique
  const enregistrerAction = async (adminId, action) => {
    try {
        const nouvelleAction = new HistoriqueAction({
            adminId,
            action,
            
        });
        await nouvelleAction.save();
    } catch (error) {
        console.error("Erreur lors de l'enregistrement de l'historique :", error);
    }
};

//lister les historique 
exports.getHistorique = async (req, res) => {
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