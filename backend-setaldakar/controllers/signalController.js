//controller/alertecontroller.js
// controllers/alerte.controller.js
const Alerte = require('../models/signal');
const Utilisateur = require('../models/Utilisateur');
const PhotoService = require('../services/photo.service');
const GeolocationService = require('../services/geolocation.service');
const { enregistrerAction } = require('./utilisateurController');
const HistoriqueAction = require('../models/HistoriqueAction');
const EmailDeposSauvagesService = require('../services/email.service');
class AlerteController {
    //creation d'alerte
  static async createAlerte(req, res) {
    try {
      const {  description, adresse, latitude, longitude} = req.body;
      
      // Validation des données
      if (!description || !adresse || !latitude || !longitude) {
        return res.status(400).json({ 
          message: 'Veuillez fournir toutes les informations nécessaires ( description, adresse, coordonnées)'
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
      const { statut, priorite, page = 1, limit = 10, startDate, endDate } = req.query;
      const filter = {};
  
      // Appliquer les filtres si fournis
      if (statut) filter.statut = statut;
      if (priorite) filter.priorite = priorite;
  
      // Filtrage basé sur le rôle de l'utilisateur
      if (req.utilisateur.role === 'utilisateur') {
        filter.declarant = req.utilisateur.userId;
      } else if (req.utilisateur.role === 'videur') {
        filter.chauffeurAssigne = req.utilisateur.userId;
      }
  
      // Filtrer par date
      if (startDate && endDate) {
        filter.dateCreation = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
  
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
  
      // Ajouter le préfixe de l'URL aux chemins des photos
      const baseUrl = 'http://localhost:3000'; // Remplacez par l'URL de votre serveur
      alerte.photos.forEach(photo => {
        // Assurez-vous que le chemin est correct
        photo.chemin = `${baseUrl}/uploads${photo.chemin.replace('/alertes/compressed', '/alertes')}`;
      });
  
      res.json(alerte);
    } catch (error) {
      res.status(500).json({
        message: 'Erreur lors de la récupération de l\'alerte',
        error: error.message
      });
    }
  }
  
  // afficher les 7 dernier alerte les plus recente

  static async getAlertesLast7Days(req, res) {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
  
      const alertes = await Alerte.aggregate([
        {
          $match: {
            dateCreation: {
              $gte: sevenDaysAgo,
              $lte: today
            }
          }
        },
        {
          $group: {
            _id: { $dayOfWeek: "$dateCreation" },
            count: { $sum: 1 }
          }
        }
      ]);
  
      // Initialiser un tableau pour les 7 jours de la semaine
      const daysOfWeek = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
      const alertesParJour = daysOfWeek.map((day, index) => {
        const alerte = alertes.find(a => a._id === index + 1);
        return {
          day: day,
          count: alerte ? alerte.count : 0
        };
      });
  
      res.json(alertesParJour);
    } catch (error) {
      res.status(500).json({
        message: 'Erreur lors de la récupération des alertes des 7 derniers jours',
        error: error.message
      });
    }
  }
  

  // Nouvelle méthode pour assigner un videur à une alerte
  static async assignerVideur(req, res) {
    try {
      const { id } = req.params;
      const { videurId, envoyerEmail } = req.body;
  
      if (!videurId) {
        return res.status(400).json({ message: 'ID du videur requis' });
      }
  
      const alerte = await Alerte.findById(id);
      if (!alerte) {
        return res.status(404).json({ message: 'Alerte non trouvée' });
      }
  
      const videur = await Utilisateur.findById(videurId);
      if (!videur || videur.role !== 'videur') {
        return res.status(404).json({ message: 'Videur non trouvé' });
      }
  
      alerte.chauffeurAssigne = videurId;
      alerte.statut = 'En cours';
      alerte.dateAssignation = new Date();
  
      await alerte.save();
  
      await HistoriqueAction.create({
        adminId: req.utilisateur.userId,
        action: 'ASSIGNER_VIDEUR',
        cibleId: videurId,
        details: JSON.stringify({
          videurId,
          alerteId: id
        })
      });
  
      if (envoyerEmail) {
        await EmailDeposSauvagesService.envoyerEmailDeposSauvage(alerte, videur);
      }
  
      res.json({
        message: 'Videur assigné avec succès',
        alerte: {
          id: alerte._id,
          statut: alerte.statut,
          chauffeurAssigne: videur.nom + ' ' + videur.prenom
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'assignation du videur:', error);
      res.status(500).json({
        message: 'Erreur lors de l\'assignation du videur',
        error: error.message
      });
    }
    
  }

 

}




module.exports = AlerteController;