const Depot = require('../models/depos');
const User = require('../models/Utilisateur'); // Assurez-vous d'avoir un modèle User pour les gardiens

// Créer un nouveau dépôt
exports.createDepot = async (req, res) => {
  try {
    const { lieu, latitude, longitude, gardien_id } = req.body;

    // Vérifiez si le gardien existe
    const gardien = await User.findById(gardien_id);
    if (!gardien) {
      return res.status(404).json({ message: 'Gardien non trouvé' });
    }

    const depot = new Depot({
      lieu,
      coordonnees: { latitude, longitude },
      gardien_id
    });

    await depot.save();
    res.status(201).json({ message: 'Dépôt créé avec succès', depot });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lister tous les dépôts
exports.getDepots = async (req, res) => {
  try {
    const depots = await Depot.find().populate('gardien_id', 'nom email'); // Remplacez 'nom email' par les champs que vous souhaitez récupérer du gardien
    res.json(depots);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
//lister le nmbre de depos
// Ajouter cette fonction dans votre contrôleur (../controllers/depotController.js)
exports.getDepotsCount = async (req, res) => {
  try {
    const count = await Depot.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
