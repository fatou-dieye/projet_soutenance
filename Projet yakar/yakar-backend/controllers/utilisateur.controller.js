// controllers/utilisateur.controller.js
const bcrypt = require('bcryptjs');
const Utilisateur = require('../models/utilisateur.model');

class UtilisateurController {
  // Obtenir tous les utilisateurs
  static async getAllUtilisateurs(req, res) {
    try {
      const utilisateurs = await Utilisateur.find()
        .select('-mot_passe -code_secret')
        .sort('-dateCreation');

      res.json({
        success: true,
        utilisateurs,
        totalUtilisateurs: utilisateurs.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs',
        error: error.message
      });
    }
  }

  // Mettre à jour un utilisateur
  static async updateUtilisateur(req, res) {
    try {
      const { id } = req.params;
      const { nom, prenom, email, role, mot_passe, code_secret } = req.body;

      // Vérifier si l'utilisateur existe
      const utilisateur = await Utilisateur.findById(id);
      if (!utilisateur) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Préparer les données de mise à jour
      const updateData = {};

      // Ajouter directement nom et prénom s'ils sont fournis
      if (nom) updateData.nom = nom;
      if (prenom) updateData.prenom = prenom;

      // Vérifier uniquement l'email (qui doit être unique)
      if (email) {
        const emailExistant = await Utilisateur.findOne({ 
          email, 
          _id: { $ne: id } 
        });
        if (emailExistant) {
          return res.status(400).json({
            success: false,
            message: 'Cet email est déjà utilisé'
          });
        }
        updateData.email = email;
      }

      // Vérifier le code secret
      if (code_secret) {
        if (!/^\d{4}$/.test(code_secret)) {
          return res.status(400).json({
            success: false,
            message: 'Le code secret doit contenir exactement 4 chiffres'
          });
        }
//si le code existe dejas dans la base de donner
        const codeExistant = await Utilisateur.findOne({ 
          code_secret, 
          _id: { $ne: id } 
        });
        if (codeExistant) {
          return res.status(400).json({
            success: false,
            message: 'Ce code secret est déjà utilisé'
          });
        }
        updateData.code_secret = code_secret;
      }

      // Mettre à jour le rôle si fourni
      if (role) {
        if (!['administrateur', 'utilisateur'].includes(role)) {
          return res.status(400).json({
            success: false,
            message: 'Rôle invalide'
          });
        }
        updateData.role = role;
      }

      // Hasher le mot de passe si fourni
      if (mot_passe) {
        if (mot_passe.length < 8) {
          return res.status(400).json({
            success: false,
            message: 'Le mot de passe doit contenir au moins 8 caractères'
          });
        }
        const salt = await bcrypt.genSalt(10);
        updateData.mot_passe = await bcrypt.hash(mot_passe, salt);
      }

      // Mettre à jour l'utilisateur
      const utilisateurMaj = await Utilisateur.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      ).select('-mot_passe -code_secret');

      res.json({
        success: true,
        message: 'Utilisateur mis à jour avec succès',
        utilisateur: utilisateurMaj
      });

    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      
      // Gestion des différents types d'erreurs
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: Object.values(error.errors).map(err => err.message)
        });
      }

      if (error.code === 11000) {
        // En cas de violation de contrainte unique
        const field = Object.keys(error.keyPattern)[0];
        const message = field === 'email' ? 
          'Cet email est déjà utilisé' : 
          'Ce code secret est déjà utilisé';
        
        return res.status(400).json({
          success: false,
          message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'utilisateur',
        error: error.message
      });
    }
  }
  // Rechercher des utilisateurs
  static async rechercherUtilisateurs(req, res) {
    try {
      const { terme, role } = req.query;
      let query = {};

      if (terme) {
        query.$or = [
          { nom: { $regex: terme, $options: 'i' } },
          { prenom: { $regex: terme, $options: 'i' } },
          { email: { $regex: terme, $options: 'i' } }
        ];

        if (/^\d+$/.test(terme)) {
          query.$or.push({ code_secret: parseInt(terme) });
        }
      }

      if (role) {
        query.role = role;
      }

      const utilisateurs = await Utilisateur.find(query)
        .select('-mot_passe -code_secret')
        .sort('-dateCreation');

      res.json({
        success: true,
        utilisateurs,
        total: utilisateurs.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des utilisateurs',
        error: error.message
      });
    }
  }

  // Obtenir un utilisateur par ID
  static async getUtilisateurById(req, res) {
    try {
      const { id } = req.params;
      
      const utilisateur = await Utilisateur.findById(id)
        .select('-mot_passe -code_secret');

      if (!utilisateur) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        utilisateur
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'utilisateur',
        error: error.message
      });
    }
  }

  // Supprimer un utilisateur
  static async deleteUtilisateur(req, res) {
    try {
      const { id } = req.params;

      const utilisateur = await Utilisateur.findById(id);
      if (!utilisateur) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      if (utilisateur.role === 'administrateur') {
        const nombreAdmins = await Utilisateur.countDocuments({ role: 'administrateur' });
        if (nombreAdmins <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Impossible de supprimer le dernier administrateur'
          });
        }
      }

      await Utilisateur.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Utilisateur supprimé avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'utilisateur',
        error: error.message
      });
    }
  }

  // Supprimer plusieurs utilisateurs (admin uniquement)
  static async deleteMultipleUtilisateurs(req, res) {
    try {
      const { ids } = req.body;
  
      // Validation des données d'entrée
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Veuillez fournir un tableau d\'IDs d\'utilisateurs à supprimer'
        });
      }
  
      // Vérifier si les IDs sont valides
      const invalidIds = ids.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Certains IDs sont invalides',
          invalidIds
        });
      }
  
      // Vérifier si les utilisateurs existent
      const utilisateurs = await Utilisateur.find({ _id: { $in: ids } });
      
      if (utilisateurs.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Aucun utilisateur trouvé avec les IDs fournis'
        });
      }
  
      if (utilisateurs.length !== ids.length) {
        const trouves = utilisateurs.map(u => u._id.toString());
        const nonTrouves = ids.filter(id => !trouves.includes(id));
        return res.status(400).json({
          success: false,
          message: 'Certains utilisateurs n\'ont pas été trouvés',
          idsNonTrouves: nonTrouves
        });
      }
  
      // Vérifier les administrateurs
      const admins = utilisateurs.filter(user => user.role === 'administrateur');
      if (admins.length > 0) {
        const nombreTotalAdmins = await Utilisateur.countDocuments({ role: 'administrateur' });
        if (nombreTotalAdmins <= admins.length) {
          return res.status(400).json({
            success: false,
            message: 'Impossible de supprimer tous les administrateurs'
          });
        }
      }
  
      // Supprimer les utilisateurs
      const resultat = await Utilisateur.deleteMany({ _id: { $in: ids } });
  
      res.json({
        success: true,
        message: `${resultat.deletedCount} utilisateur(s) supprimé(s) avec succès`,
        details: {
          tentatives: ids.length,
          reussies: resultat.deletedCount
        }
      });
  
    } catch (error) {
      console.error('Erreur suppression multiple:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression des utilisateurs',
        error: error.message
      });
    }
  }

}

module.exports = UtilisateurController;