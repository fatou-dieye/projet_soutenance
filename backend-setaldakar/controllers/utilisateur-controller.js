// controllers/utilisateur.controller.js
const Utilisateur = require('../models/utilisateur.model');
const multer = require('multer');
const bcrypt = require('bcrypt');
const { logAction } = require('./historiqueController');

// Configuration du stockage des images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Dossier où seront stockées les images
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });



// Fonction pour valider le format de l'email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Fonction pour valider le numéro de téléphone
function isValidPhoneNumber(phone) {
    const phoneRegex = /^(70|76|77|78|75)\d{7}$/;
    return phoneRegex.test(phone);
}

// Inscription
exports.register = async (req, res) => {
  try {
      const { nom, prenom, email, mot_passe, adresse, telephone, role, statut } = req.body;
      const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

      // Vérifiez que toutes les données nécessaires sont présentes
      if (!nom || !prenom || !email || !mot_passe || !adresse || !telephone || !role) {
          return res.status(400).json({ message: 'Toutes les informations sont requises.' });
      }

      // Vérification du format de l'email et du téléphone
      if (!isValidEmail(email)) {
          return res.status(400).json({ message: 'Format d\'email invalide.' });
      }

      if (!isValidPhoneNumber(telephone)) {
          return res.status(400).json({ message: 'Numéro de téléphone invalide.' });
      }

      // Vérification si l'email ou le téléphone existe déjà
      const existingUserByEmail = await Utilisateur.findOne({ email });
      if (existingUserByEmail) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
      }

      const existingUserByPhone = await Utilisateur.findOne({ telephone });
      if (existingUserByPhone) {
          return res.status(400).json({ message: 'Ce numéro de téléphone est déjà utilisé.' });
      }

      // Vérification de la force du mot de passe
      if (mot_passe.length < 8) {
          return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
      }

      // Hachage du mot de passe avant enregistrement
      const hashedPassword = await bcrypt.hash(mot_passe, 10);
      console.log('Mot de passe haché lors de l\'inscription :', hashedPassword);

      // Création de l'utilisateur
      const nouvelUtilisateur = new Utilisateur({
          nom,
          prenom,
          email,
          mot_passe: hashedPassword,
          photo: photoPath,
          adresse,
          telephone,
          role,
          statut: statut || 'active',
      });

      await nouvelUtilisateur.save();

      // Enregistrement de l'action dans l'historique
      await logAction(nouvelUtilisateur._id, "Inscription réussie");

      res.status(201).json({
          message: 'Utilisateur créé avec succès',
          user: {
              id: nouvelUtilisateur._id,
              email: nouvelUtilisateur.email,
              role: nouvelUtilisateur.role
          }
      });
  } catch (error) {
      console.error('Erreur lors de l\'inscription :', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};






// Lister tous les utilisateurs
exports.getAllUsers = async (req, res) => {
    try {
        const utilisateurs = await Utilisateur.find().select('-mot_passe');
        res.json(utilisateurs);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs', error: error.message });
    }
};

// Récupérer un utilisateur par ID
exports.getUserById = async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.params.id).select('-mot_passe');
        if (!utilisateur) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json(utilisateur);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur', error: error.message });
    }
};


/**
 * Mettre à jour le statut de plusieurs utilisateurs
 */

const updateUsersStatus = async (req, res) => {
    try {
      const { userIds, statut } = req.body;
  
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'Veuillez fournir un tableau d\'identifiants d\'utilisateurs valide' });
      }
  
      if (!['bloquer', 'active'].includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide. Utilisez "bloquer" ou "active".' });
      }
  
      const result = await Utilisateur.updateMany({ _id: { $in: userIds } }, { $set: { statut: statut } });
  
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Aucun utilisateur trouvé pour la mise à jour' });
      }
  
      res.json({ 
        message: `${result.modifiedCount} utilisateur(s) mis à jour avec succès`,
        modifiedCount: result.modifiedCount
      });
  
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statuts:', error);
      res.status(500).json({ message: 'Erreur lors de la mise à jour des utilisateurs', error: error.message });
    }
  };
  
  /**
   * Modifier un utilisateur
   */
  const updateUser = async (req, res) => {
    try {
      const { nom, prenom, email, role, adresse, telephone, statut } = req.body;
      const utilisateur = await Utilisateur.findById(req.params.id);
  
      if (!utilisateur) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
  
      if (req.file) {
        utilisateur.photo = `/uploads/${req.file.filename}`;
      }
  
      utilisateur.nom = nom || utilisateur.nom;
      utilisateur.prenom = prenom || utilisateur.prenom;
      utilisateur.email = email || utilisateur.email;
      utilisateur.role = role || utilisateur.role;
      utilisateur.adresse = adresse || utilisateur.adresse;
      utilisateur.telephone = telephone || utilisateur.telephone;
      utilisateur.statut = statut || utilisateur.statut;
  
      await utilisateur.save();
  
      res.json({
        message: 'Utilisateur mis à jour avec succès',
        user: {
          id: utilisateur._id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          photo: utilisateur.photo,
          adresse: utilisateur.adresse,
          telephone: utilisateur.telephone,
          role: utilisateur.role,
          statut: utilisateur.statut
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur', error: error.message });
    }
  };


// Changer le mot de passe
exports.changePassword = async (req, res) => {
    try {
      const { ancien_mot_passe, nouveau_mot_passe, confirmation_mot_passe } = req.body;
  
      if (!ancien_mot_passe || !nouveau_mot_passe || !confirmation_mot_passe) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
      }
  
      if (nouveau_mot_passe !== confirmation_mot_passe) {
        return res.status(400).json({ message: 'Le nouveau mot de passe et la confirmation ne correspondent pas' });
      }
  
      const utilisateur = await Utilisateur.findById(req.params.id);
      if (!utilisateur) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
  
      const isPasswordValid = await bcrypt.compare(ancien_mot_passe, utilisateur.mot_passe);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
      }
  
      // Hacher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(nouveau_mot_passe, 10);
      utilisateur.mot_passe = hashedPassword;
      await utilisateur.save();
  
      res.json({
        message: 'Mot de passe mis à jour avec succès',
        user: { id: utilisateur._id, email: utilisateur.email }
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors du changement de mot de passe', error: error.message });
    }
  };
  
  // Statistiques des utilisateurs par rôle
  exports.getUserStatistics = async (req, res) => {
    try {
      const statistiques = await Utilisateur.aggregate([{ $group: { _id: "$role", total: { $sum: 1 } } }]);
      const totalUtilisateurs = await Utilisateur.countDocuments();
  
      const statsParRole = { administrateur: 0, utilisateur: 0, videur: 0, gardient: 0, total: totalUtilisateurs };
      statistiques.forEach(stat => { statsParRole[stat._id] = stat.total; });
  
      res.status(200).json(statsParRole);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  };
  
  // Suppression multiple d'utilisateurs
  exports.bulkDeleteUsers = async (req, res) => {
    try {
      const { userIds } = req.body;
  
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'Veuillez fournir un tableau d\'identifiants valide' });
      }
  
      if (userIds.includes(req.utilisateur.userId)) {
        return res.status(403).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
      }
  
      const result = await Utilisateur.deleteMany({ _id: { $in: userIds } });
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Aucun utilisateur trouvé' });
      }
  
      res.json({ message: `${result.deletedCount} utilisateur(s) supprimé(s) avec succès`, deletedCount: result.deletedCount });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
    }
  };
  
  // Suppression d'un utilisateur
  exports.deleteUser = async (req, res) => {
    try {
      const utilisateur = await Utilisateur.findByIdAndDelete(req.params.id);
      if (!utilisateur) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
    }
  };
  exports.upload = upload;
exports.updateUsersStatus = updateUsersStatus;
exports.updateUser = updateUser;
