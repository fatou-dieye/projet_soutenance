// controllers/utilisateur.controller.js
const Utilisateur = require('../models/Utilisateur');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const { enregistrerAction  } = require('../controllers/historiqueController');// Configuration du stockage des images

const HistoriqueAction = require('../models/HistoriqueAction');



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


// Inscription
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, mot_passe, adresse, telephone, role, statut } = req.body;
    const photoPath = req.file ? `http://localhost:3000/api/uploads/${req.file.filename}` : null;
    
    // Vérifier si l'email ou le téléphone existe déjà
    const utilisateurExistant = await Utilisateur.findOne({ $or: [{ email }, { telephone }] });
    if (utilisateurExistant) {
      if (utilisateurExistant.email === email) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
      if (utilisateurExistant.telephone === telephone) {
        return res.status(400).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
      }
    }
    
    const nouvelUtilisateur = new Utilisateur({
      nom,
      prenom,
      email,
      mot_passe: mot_passe || null,
      photo: photoPath,
      adresse,
      telephone,
      role,
      statut: statut || 'active',
    });
    
    await nouvelUtilisateur.save();
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: nouvelUtilisateur._id,
        email: nouvelUtilisateur.email,
        role: nouvelUtilisateur.role,
        photo: nouvelUtilisateur.photo,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
  }
};
 
// Fonction pour télécharger une image de profil
const uploadProfileImage = (req, res) => {
  if (!req.file) {
      return res.status(400).send('Aucun fichier téléchargé.');
  }

  res.send({
      message: 'Image de profil téléchargée avec succès!',
      file: req.file
  });
};
// Nouvelle méthode d'inscription pour les utilisateurs avec des champs limités
exports.registerSimpleUser = async (req, res) => {
  try {
      const { nom, prenom, email, mot_passe, adresse, telephone } = req.body;

      const existingUser = await Utilisateur.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }

      const nouvelUtilisateur = new Utilisateur({
          nom,
          prenom,
          email,
          mot_passe,
          adresse,
          telephone,
          role: 'utilisateur', // Rôle par défaut pour ces utilisateurs
          statut: 'active', // Statut par défaut
      });

      await nouvelUtilisateur.save();

      // Compter le nombre d'utilisateurs inscrits avec le rôle "utilisateur"
      const nombreUtilisateurs = await Utilisateur.countDocuments({ role: 'utilisateur' });

      res.status(201).json({
          message: 'Utilisateur créé avec succès',
          user: {
              id: nouvelUtilisateur._id,
              email: nouvelUtilisateur.email,
              role: nouvelUtilisateur.role
          },
          totalUsers: nombreUtilisateurs // Inclure le nombre total d'utilisateurs avec le rôle "utilisateur" dans la réponse
      });
  } catch (error) {
      res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
  }
};

// Nouvelle méthode pour récupérer le nombre d'utilisateurs inscrits
exports.getTotalUsers = async (req, res) => {
  try {
    const nombreUtilisateurs = await Utilisateur.countDocuments({ role: 'utilisateur' });
    res.status(200).json({ totalUsers: nombreUtilisateurs });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du comptage des utilisateurs', error: error.message });
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
      
      // Enregistrer chaque modification dans l'historique
     
       
      res.json({ 
        message: `${result.modifiedCount} utilisateur(s) mis à jour avec succès`,
        modifiedCount: result.modifiedCount
      });
  
      await enregistrerAction(req.utilisateur.userId, "Changement de statuts de plusieur utilisateur");
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
  
      // Si un fichier est téléchargé, mettre à jour le chemin de la photo avec l'URL complète
      if (req.file) {
        utilisateur.photo = `http://localhost:3000/api/uploads/${req.file.filename}`;
      }
  
      // Mettre à jour les autres champs de l'utilisateur
      utilisateur.nom = nom || utilisateur.nom;
      utilisateur.prenom = prenom || utilisateur.prenom;
      utilisateur.email = email || utilisateur.email;
      utilisateur.role = role || utilisateur.role;
      utilisateur.adresse = adresse || utilisateur.adresse;
      utilisateur.telephone = telephone || utilisateur.telephone;
      utilisateur.statut = statut || utilisateur.statut;
  
      // Sauvegarder les modifications
      await utilisateur.save();
  
      // Enregistrer l'action dans l'historique
      await enregistrerAction(
        req.utilisateur.userId,
        "Mise à jour d'utilisateur",
        utilisateur._id,
        `Utilisateur ${utilisateur.email} modifié`
      );
  
      // Renvoyer la réponse avec l'URL complète de la photo
      res.json({
        message: 'Utilisateur mis à jour avec succès',
        user: {
          id: utilisateur._id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          photo: utilisateur.photo, // URL complète de la photo
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
  // Changer le mot de passe et déconnecter l'utilisateur après changement
  exports.changePassword = async (req, res) => {
    try {
      const { ancien_mot_passe, nouveau_mot_passe, confirmation_mot_passe } = req.body;
      const userId = req.utilisateur.userId; // Récupérer l'ID depuis le token
  
      // Vérification des champs
      if (!ancien_mot_passe || !nouveau_mot_passe || !confirmation_mot_passe) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
      }
  
      // Vérification de la correspondance des mots de passe
      if (nouveau_mot_passe !== confirmation_mot_passe) {
        return res.status(400).json({ message: 'Le nouveau mot de passe et la confirmation ne correspondent pas' });
      }
  
      // Trouver l'utilisateur par son ID
      const utilisateur = await Utilisateur.findById(userId);
      if (!utilisateur) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
  
      // Log pour vérifier les valeurs avant la comparaison
      console.log('Ancien mot de passe envoyé:', ancien_mot_passe);
      console.log('Mot de passe stocké (haché) dans la base de données:', utilisateur.mot_passe);
  
      // Vérification si l'ancienne valeur du mot de passe est valide
      if (!ancien_mot_passe || !utilisateur.mot_passe) {
        return res.status(400).json({ message: 'Données invalides pour la comparaison du mot de passe' });
      }
  
      // Comparaison des mots de passe
      const isPasswordValid = await bcrypt.compare(ancien_mot_passe, utilisateur.mot_passe);
      console.log('Ancien mot de passe valide ? ', isPasswordValid);
  
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
      }
  
      // Mettre à jour le mot de passe sans avoir besoin de le hacher à nouveau
      utilisateur.mot_passe = nouveau_mot_passe;
  
      // Sauvegarder l'utilisateur avec le nouveau mot de passe
      await utilisateur.save();
  
      // Optionnel : Enregistrer la dernière déconnexion ou toute autre action liée à l'utilisateur
      await Utilisateur.findByIdAndUpdate(userId, { derniere_deconnexion: new Date() });
  
      // Enregistrer l'action de changement de mot de passe dans l'historique
      await enregistrerAction(utilisateur._id, "changement de mots de passe", utilisateur._id);
  
      // Réponse au client
      res.json({
        message: 'Mot de passe mis à jour avec succès. Veuillez vous reconnecter.',
        userId
      });
  
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
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
  // Suppression multiple d'utilisateurs avec enregistrement dans l'historique
exports.bulkDeleteUsers = async (req, res) => {
    try {
        const { userIds } = req.body;
        const adminId = req.utilisateur.userId; // ID de l'admin qui effectue l'action

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'Veuillez fournir un tableau d\'identifiants valide' });
        }

        if (userIds.includes(adminId)) {
            return res.status(403).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
        }

        // Récupérer les utilisateurs avant suppression pour les détails de l'historique
        const usersToDelete = await Utilisateur.find({ _id: { $in: userIds } });

        const result = await Utilisateur.deleteMany({ _id: { $in: userIds } });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Aucun utilisateur trouvé' });
        }

        // Enregistrer chaque suppression dans l'historique
        await enregistrerAction(req.utilisateur.userId, "suppression de plusieur utilisateur");
          
       

        res.json({ 
            message: `${result.deletedCount} utilisateur(s) supprimé(s) avec succès`, 
            deletedCount: result.deletedCount 
        });

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

    // Enregistrer l'action dans l'historique
    
    await enregistrerAction(req.utilisateur.userId, "Suppression d'utilisateur");
      res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
    }
  };


// Bloquer ou débloquer un utilisateur
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const utilisateur = await Utilisateur.findById(id);

    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Changer le statut entre 'active' et 'bloquer'
    const newStatut = utilisateur.statut === 'active' ? 'bloquer' : 'active';

    utilisateur.statut = newStatut;
    await utilisateur.save();

    // Enregistrer l'action dans l'historique
    await enregistrerAction(req.utilisateur.userId, "Changement de statut d'utilisateur");

    res.json({
      message: `Utilisateur ${newStatut} avec succès`,
      user: {
        id: utilisateur._id,
        statut: utilisateur.statut
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du changement de statut de l\'utilisateur', error: error.message });
  }
};



//lister l'historique de l'utilisateur connecter

exports.getHistoriqueUtilisateur = async (req, res) => {
  try {
    const adminId = req.utilisateur.userId; // Récupérer l'ID de l'utilisateur à partir du token
    const historique = await HistoriqueAction.find({ adminId }) // Filtrer par adminId
      .populate('adminId', 'nom email')
      .populate('cibleId', 'nom email')
      .sort({ date: -1 });

    res.json(historique);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique', error: error.message });
  }
};
exports.upload = upload;
exports.updateUsersStatus = updateUsersStatus;
exports.updateUser = updateUser;
exports.uploadProfileImage = uploadProfileImage;

