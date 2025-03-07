//controller/utilisateur-controller.js
// controllers/utilisateur.controller.js
const Utilisateur = require('../models/Utilisateur');
const multer = require('multer');
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
        const { nom, prenom, email, mot_passe, photo, adresse, telephone, role, statut } = req.body;
        const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
        
        const existingUser = await Utilisateur.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        
        const nouvelUtilisateur = new Utilisateur({
            nom,
            prenom,
            email,
            mot_passe,
            photo: photoPath,
            adresse,
            telephone,
            role,
            statut: statut || 'active',
        });
        
        await nouvelUtilisateur.save();
       // await enregistrerAction(req.utilisateur.userId, "inscription d'utilisateur");
        // Enregistrer l'action dans l'historique
        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            user: {
                id: nouvelUtilisateur._id,
                email: nouvelUtilisateur.email,
                role: nouvelUtilisateur.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
    }
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
  // Enregistrer l'action dans l'historique
      await enregistrerAction(req.utilisateur.userId, "Mise à jour d'utilisateur", utilisateur._id, `Utilisateur ${utilisateur.email} modifié`);    
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
  // Changer le mot de passe et déconnecter l'utilisateur après changement
exports.changePassword = async (req, res) => {
  try {
    const { ancien_mot_passe, nouveau_mot_passe, confirmation_mot_passe } = req.body;
    const userId = req.utilisateur.userId; // Récupérer l'ID depuis le token

    if (!ancien_mot_passe || !nouveau_mot_passe || !confirmation_mot_passe) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    if (nouveau_mot_passe !== confirmation_mot_passe) {
      return res.status(400).json({ message: 'Le nouveau mot de passe et la confirmation ne correspondent pas' });
    }

    const utilisateur = await Utilisateur.findById(userId);
    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si l'ancien mot de passe est valide
    const isPasswordValid = await bcrypt.compare(ancien_mot_passe, utilisateur.mot_passe);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }

 
    // Mettre à jour le mot de passe avec le nouveau mot de passe (qui doit être déjà haché)
    utilisateur.mot_passe = nouveau_mot_passe;
    
    // Sauvegarder l'utilisateur avec le nouveau mot de passe
    await utilisateur.save();
   
    // Enregistrer la dernière déconnexion (si nécessaire)
    await Utilisateur.findByIdAndUpdate(userId, { derniere_deconnexion: new Date() });

    res.json({
      message: 'Mot de passe mis à jour avec succès. Veuillez vous reconnecter.',
      userId
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

  //partie historique
  //creation historique
 


/// lister les historique
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

// Lister l'historique de l'utilisateur connecté
exports.getHistoriqueUtilisateur = async (req, res) => {
  try {
    const adminId = req.utilisateur.userId; // Récupérer l'ID de l'utilisateur à partir du token
    const historique = await HistoriqueAction.find({ adminId }) // Filtrer par adminId
      .populate('adminId', 'nom email')
      .populate('cibleId', 'nom email')
      .sort({ date: -1 });

    res.json(historique);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique', error: error.message });
  }
};


exports.upload = upload;
exports.updateUsersStatus = updateUsersStatus;
exports.updateUser = updateUser;


