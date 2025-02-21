const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Utilisateur = require('../models/utilisateur.model');
const { verifyToken, verifyRole,invalidateToken } = require('../middlware/auth.middleware');

// Login
// Login avec email/mot de passe ou téléphone/mot de passe
router.post('/login', async (req, res) => {
  try {
    const { email, telephone, mot_passe } = req.body;
    let utilisateur;
    
    // Vérification si nous avons soit un email, soit un numéro de téléphone avec un mot de passe
    if ((email || telephone) && mot_passe) {
      // Chercher l'utilisateur par email ou téléphone
      if (email) {
        utilisateur = await Utilisateur.findOne({ email });
        if (!utilisateur) {
          return res.status(404).json({ message: "Cet utilisateur n'existe pas. Vérifiez l'email." });
        }
      } else if (telephone) {
        utilisateur = await Utilisateur.findOne({ telephone });
        if (!utilisateur) {
          return res.status(404).json({ message: "Cet utilisateur n'existe pas. Vérifiez le numéro de téléphone." });
        }
      }
      
      // Vérifier si l'utilisateur est bloqué
      if (utilisateur.statut === 'bloquer') {
        return res.status(403).json({ message: "Votre compte est bloqué. Veuillez contacter l'administration." });
      }
      
      // Vérifier si le mot de passe est correct
      const validPassword = await bcrypt.compare(mot_passe, utilisateur.mot_passe);
      if (!validPassword) {
        return res.status(401).json({ message: "Mot de passe incorrect. Réessayez." });
      }
    } else {
      return res.status(400).json({ 
        message: 'Veuillez fournir soit un email et mot de passe, soit un numéro de téléphone et mot de passe.' 
      });
    }
    
    // Génération du token si tout est bon
    const token = jwt.sign(
      {
        userId: utilisateur._id,
        email: utilisateur.email,
        role: utilisateur.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: utilisateur._id,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        role: utilisateur.role,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom
      }
    });
    
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la connexion', 
      error: error.message 
    });
  }
});




// Route de déconnexion
router.post('/logout', verifyToken, async (req, res) => {
    try {
        // Récupérer l'ID de l'utilisateur à partir du token
        const userId = req.utilisateur.userId;

        // Optionnel : Vous pouvez ajouter une logique supplémentaire si nécessaire
        // Par exemple, mettre à jour un champ de dernière déconnexion
        await Utilisateur.findByIdAndUpdate(userId, { 
            derniere_deconnexion: new Date() 
        });

         // Récupérer le token depuis l'en-tête
         const token = req.headers.authorization.split(' ')[1];
        
         // Invalider le token
         invalidateToken(token);
 

        res.json({ 
            message: 'Déconnexion réussie',
            userId: userId 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Erreur lors de la déconnexion', 
            error: error.message 
        });
    }
});

// Inscription
router.post('/register', async (req, res) => {
    try {
      const { nom, prenom, email, mot_passe, photo, adresse, telephone, role, statut } = req.body;
       // Récupérer le chemin de la photo si elle a été téléchargée
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
  });

//inserer photo 
const multer = require('multer');

// Configuration du stockage
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



// Route protégée pour le profil
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.utilisateur.userId)
            .select('-mot_passe -code_secret');
        if (!utilisateur) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json(utilisateur);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération du profil' });
    }
});

// Route protégée pour les administrateurs
router.get('/admin', verifyToken, verifyRole(['administrateur']), async (req, res) => {
    res.json({ message: 'Accès administrateur autorisé' });
});

module.exports = router;



// Dans votre fichier de routes utilisateur

// Lister tous les utilisateurs
router.get('/users', verifyToken, verifyRole(['administrateur']), async (req, res) => {
    try {
        const utilisateurs = await Utilisateur.find().select('-mot_passe ');
        res.json(utilisateurs);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs', error: error.message });
    }
});

// Récupérer un utilisateur par ID
router.get('/users/:id', verifyToken, async (req, res) => {
    try {
        const utilisateur = await Utilisateur.findById(req.params.id).select('-mot_passe ');
        if (!utilisateur) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json(utilisateur);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur', error: error.message });
    }
});




// Mettre à jour le bloquer ou debloquer  plusieurs utilisateurs à la fois
router.put('/users/bulk-update-status', verifyToken, verifyRole(['administrateur']), async (req, res) => {
  try {
      const { userIds, statut } = req.body;

      // Vérifier si userIds est un tableau valide
      if (!Array.isArray(userIds) || userIds.length === 0) {
          return res.status(400).json({ 
              message: 'Veuillez fournir un tableau d\'identifiants d\'utilisateurs valide' 
          });
      }

      // Vérifier si le statut est valide
      if (!['bloquer', 'active'].includes(statut)) {
          return res.status(400).json({ 
              message: 'Statut invalide. Utilisez "bloquer" ou "active".' 
          });
      }

      // Mise à jour des statuts des utilisateurs sélectionnés
      const result = await Utilisateur.updateMany(
          { _id: { $in: userIds } }, 
          { $set: { statut: statut } }
      );

      if (result.matchedCount === 0) {
          return res.status(404).json({ 
              message: 'Aucun utilisateur trouvé pour la mise à jour' 
          });
      }

      res.json({ 
          message: `${result.modifiedCount} utilisateur(s) ${result.statut} mis à jour avec succès`,
          modifiedCount: result.modifiedCount
      });

  } catch (error) {
      console.error('Erreur lors de la mise à jour des statuts:', error);
      res.status(500).json({ 
          message: 'Erreur lors de la mise à jour des utilisateurs', 
          error: error.message 
      });
  }
});




// Modifier un utilisateur
router.put('/users/:id', verifyToken, upload.single('photo'), async (req, res) => {
    try {
      const { nom, prenom, email, role, adresse, telephone, statut } = req.body;
      
      const utilisateur = await Utilisateur.findById(req.params.id);
      if (!utilisateur) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      
      // Traitement de la photo si elle est fournie
      if (req.file) {
        utilisateur.photo = `/uploads/${req.file.filename}`;
      }
      
      // Mettre à jour tous les champs modifiables
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
  });


//modifier mots de passe en mettant l'ancien d'abord
// Route pour changer le mot de passe
// Route pour changer le mot de passe
router.put('/users/:id/change-password', verifyToken, async (req, res) => {
  try {
    const { ancien_mot_passe, nouveau_mot_passe, confirmation_mot_passe } = req.body;
    
    // Vérifier que tous les champs sont remplis
    if (!ancien_mot_passe || !nouveau_mot_passe || !confirmation_mot_passe) {
      return res.status(400).json({
        message: 'Tous les champs sont requis: ancien mot de passe, nouveau mot de passe et confirmation'
      });
    }
    
    // Vérifier que le nouveau mot de passe et la confirmation correspondent
    if (nouveau_mot_passe !== confirmation_mot_passe) {
      return res.status(400).json({ 
        message: 'Le nouveau mot de passe et la confirmation ne correspondent pas' 
      });
    }
    
    // Trouver l'utilisateur
    const utilisateur = await Utilisateur.findById(req.params.id);
    if (!utilisateur) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(ancien_mot_passe, utilisateur.mot_passe);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    }
    
    // Hacher le nouveau mot de passe
   
    const hashedPassword = nouveau_mot_passe;
    
    // Mettre à jour et sauvegarder
    utilisateur.mot_passe = hashedPassword;
    await utilisateur.save();
    
    res.json({
      message: 'Mot de passe mis à jour avec succès',
      user: {
        id: utilisateur._id,
        email: utilisateur.email
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors du changement de mot de passe',
      error: error.message
    });
  }
});



// Route pour obtenir les statistiques des utilisateurs par rôle
router.get('/statistiques-utilisateurs', async (req, res) => {
  try {
    const statistiques = await Utilisateur.aggregate([
      { $group: { _id: "$role", total: { $sum: 1 } } }
    ]);

    const totalUtilisateurs = await Utilisateur.countDocuments();

    // Construire un objet pour afficher les données proprement
    const statsParRole = {
      administrateur: 0,
      utilisateur: 0,
      videur: 0,
      gardient: 0,
      total: totalUtilisateurs
    };

    // Remplir les valeurs réelles trouvées dans la base de données
    statistiques.forEach(stat => {
      statsParRole[stat._id] = stat.total;
    });

    res.status(200).json(statsParRole);
  } catch (error) {
    console.error("Erreur lors du comptage :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer plusieurs utilisateurs à la fois
router.delete('/users/bulk-delete', verifyToken, verifyRole(['administrateur']), async (req, res) => {
  try {
      const { userIds } = req.body;
      
      // Vérifier si userIds est un tableau valide
      if (!Array.isArray(userIds) || userIds.length === 0) {
          return res.status(400).json({ 
              message: 'Veuillez fournir un tableau d\'identifiants d\'utilisateurs valide' 
          });
      }
      
      // Vérifier qu'aucun des IDs n'est celui de l'utilisateur actuel
      if (userIds.includes(req.utilisateur.userId)) {
          return res.status(403).json({
              message: 'Vous ne pouvez pas supprimer votre propre compte dans une suppression groupée'
          });
      }
      
      // Effectuer la suppression multiple
      const result = await Utilisateur.deleteMany({ 
          _id: { $in: userIds },
          // Protection supplémentaire: empêcher la suppression d'administrateurs si nécessaire
          // role: { $ne: 'administrateur' } // Décommentez si vous voulez empêcher la suppression d'administrateurs
      });
      
      if (result.deletedCount === 0) {
          return res.status(404).json({ 
              message: 'Aucun utilisateur trouvé ou autorisé à être supprimé' 
          });
      }
      
      res.json({ 
          message: `${result.deletedCount} utilisateur(s) supprimé(s) avec succès`,
          deletedCount: result.deletedCount
      });
  } catch (error) {
      console.error('Erreur lors de la suppression multiple:', error);
      res.status(500).json({ 
          message: 'Erreur lors de la suppression des utilisateurs', 
          error: error.message 
      });
  }
});


// Supprimer un utilisateur
router.delete('/users/:id', verifyToken, verifyRole(['administrateur']), async (req, res) => {
  try {
      const utilisateur = await Utilisateur.findByIdAndDelete(req.params.id);
      
      if (!utilisateur) {
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      
      res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur', error: error.message });
  }
});


// Mettre à jour le bloquer ou debloquer  plusieurs utilisateurs à la fois
router.put('/users/bulk-update-status', verifyToken, verifyRole(['administrateur']), async (req, res) => {
  try {
      const { userIds, status } = req.body;

      // Vérifier si userIds est un tableau valide
      if (!Array.isArray(userIds) || userIds.length === 0) {
          return res.status(400).json({ 
              message: 'Veuillez fournir un tableau d\'identifiants d\'utilisateurs valide' 
          });
      }

      // Vérifier si le statut est valide
      if (!['bloquer', 'active'].includes(status)) {
          return res.status(400).json({ 
              message: 'Statut invalide. Utilisez "bloquer" ou "active".' 
          });
      }

      // Mise à jour des statuts des utilisateurs sélectionnés
      const result = await Utilisateur.updateMany(
          { _id: { $in: userIds } }, 
          { $set: { status: status } }
      );

      if (result.matchedCount === 0) {
          return res.status(404).json({ 
              message: 'Aucun utilisateur trouvé pour la mise à jour' 
          });
      }

      res.json({ 
          message: `${result.modifiedCount} utilisateur(s) mis à jour avec succès`,
          modifiedCount: result.modifiedCount
      });

  } catch (error) {
      console.error('Erreur lors de la mise à jour des statuts:', error);
      res.status(500).json({ 
          message: 'Erreur lors de la mise à jour des utilisateurs', 
          error: error.message 
      });
  }
});
