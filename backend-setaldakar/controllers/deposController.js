const Depot = require('../models/depos');
const User = require('../models/Utilisateur'); // Assurez-vous d'avoir un modèle User pour les gardiens

// Créer un nouveau dépôt
// Créer un nouveau dépôt
exports.createDepot = async (req, res) => {
  try {
    const { lieu, latitude, longitude, gardien_id } = req.body;

    // Vérifiez si le gardien existe
    const gardien = await User.findById(gardien_id);
    if (!gardien) {
      return res.status(404).json({ message: 'Gardien non trouvé' });
    }

    // 🔒 Vérifier si le gardien est déjà lié à un dépôt
    const existingDepot = await Depot.findOne({ gardien_id });
    if (existingDepot) {
      return res.status(400).json({ message: 'Ce gardien est déjà assigné à un dépôt.' });
    }

    // ✅ Créer le dépôt
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


// Obtenir les gardiens disponibles pour une zone (non assignés à un dépôt)
exports.getAvailableGardiensByAdresse = async (req, res) => {
  try {
    const { adresse } = req.query;

    // Vérifier si l'adresse est bien fournie
    if (!adresse) {
      return res.status(400).json({ message: 'L\'adresse est requise.' });
    }

    // Chercher les gardiens déjà assignés à un dépôt
    const depots = await Depot.find({}, 'gardien_id'); // On récupère les gardiens assignés
    const assignedIds = depots.map(d => d.gardien_id.toString()); // Extraire les IDs des gardiens assignés

    console.log('Gardiens déjà assignés:', assignedIds); // Affichage des gardiens déjà assignés

    // Récupérer les gardiens qui ont la bonne adresse et ne sont pas encore assignés à un dépôt
    const availableGardiens = await User.find({  // Utiliser "User" ici
      role: 'gardient', // Assure-toi que le rôle est bien 'gardient'
      adresse: { $regex: new RegExp(adresse, 'i') }, // Utilise $regex pour être insensible à la casse
      _id: { $nin: assignedIds } // Exclure les gardiens déjà assignés à un dépôt
    }).select('nom prenom email adresse');

    console.log('Gardiens disponibles:', availableGardiens); // Affiche les gardiens récupérés

    res.status(200).json(availableGardiens);
  } catch (error) {
    console.error('Erreur lors de la récupération des gardiens disponibles:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};