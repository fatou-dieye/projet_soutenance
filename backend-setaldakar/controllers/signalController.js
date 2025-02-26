//controller/alertecontroller.js
// controllers/alerte.controller.js
const Alerte = require('../models/signal');
const Utilisateur = require('../models/Utilisateur');
const PhotoService = require('../services/photo.service');
const GeolocationService = require('../services/geolocation.service');
const { enregistrerAction } = require('./utilisateurController');
const HistoriqueAction = require('../models/HistoriqueAction');

class AlerteController {
    //creation d'alerte
  static async createAlerte(req, res) {
    try {
      const {  description, adresse, latitude, longitude} = req.body;
      
      // Validation des données
      if (!description || !adresse || !latitude || !longitude) {
        return res.status(400).json({ 
          message: 'Veuillez fournir toutes les informations nécessaires (titre, description, adresse, coordonnées)'
        });
      }
      
      // Création de l'alerte
      const nouvelleAlerte = new Alerte({
       
        description,
        adresse,
        coordonnees: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        photos: req.compressedFiles || [],
      
        declarant: req.utilisateur.userId
      });
      
      await nouvelleAlerte.save();
      
        // Enregistrer l'action dans l'historique
   

      res.status(201).json({
        message: 'Alerte créée avec succès',
        alerte: {
          id: nouvelleAlerte._id,
        
          statut: nouvelleAlerte.statut,
          adresse: nouvelleAlerte.adresse,
          
        }
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'alerte:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la création de l\'alerte', 
        error: error.message 
      });
    }
  }

  //pour lister les alerte
  static async getAlertes(req, res) {
    try {
      const { statut, priorite, page = 1, limit = 10 } = req.query;
      const filter = {};
      
      // Appliquer les filtres si fournis
      if (statut) filter.statut = statut;
      if (priorite) filter.priorite = priorite;
      
      // Filtrage basé sur le rôle de l'utilisateur
      if (req.utilisateur.role === 'utilisateur') {
        // Les citoyens ne voient que leurs propres alertes
        filter.declarant = req.utilisateur.userId;
      } else if (req.utilisateur.role === 'videur') {
        // Les chauffeurs voient les alertes qui leur sont assignées
        filter.chauffeurAssigne = req.utilisateur.userId;
      }
      // Les administrateurs voient toutes les alertes (pas de filtre supplémentaire)
      
      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Récupération des alertes avec population des références
      const alertes = await Alerte.find(filter)
        .sort({ dateCreation: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('declarant', 'nom prenom telephone email')
        .populate('chauffeurAssigne', 'nom prenom telephone email');
      
      // Compter le nombre total d'alertes pour la pagination
      const total = await Alerte.countDocuments(filter);
      
      res.json({
        alertes,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des alertes', 
        error: error.message 
      });
    }
  }

  static async getAlerteById(req, res) {
    try {
      const alerte = await Alerte.findById(req.params.id)
        .populate('declarant', 'nom prenom telephone email')
        .populate('chauffeurAssigne', 'nom prenom telephone email')
        .populate('commentaires.auteur', 'nom prenom role');
      
      if (!alerte) {
        return res.status(404).json({ message: 'Alerte non trouvée' });
      }
      
      // Vérifier les permissions selon le rôle
      if (req.utilisateur.role === 'utilisateur' && 
          alerte.declarant._id.toString() !== req.utilisateur.userId) {
        return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à cette alerte' });
      }
      
      res.json(alerte);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération de l\'alerte', 
        error: error.message 
      });
    }
  }
}

module.exports = AlerteController;