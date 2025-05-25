
//controller/alertecontroller.js
// controllers/alerte.controller.js
const Alerte = require('../models/Signal');
const Utilisateur = require('../models/Utilisateur');
const PhotoService = require('../services/photo.service');
const GeolocationService = require('../services/geolocation.service');
const HistoriqueAction = require('../models/HistoriqueAction');
const EmailDeposSauvagesService = require('../services/email.service');

const axios = require('axios');
const { enregistrerAction } = require('./historiqueController');
const jwt = require('jsonwebtoken');

class AlerteController {



    static async createAlerte(req, res) {
      try {
        const { description, adresse, latitude, longitude } = req.body;
    
        // Validation des données
        if (!description || !adresse || !latitude || !longitude) {
          return res.status(400).json({
            message: 'Veuillez fournir toutes les informations nécessaires (titre, description, adresse, coordonnées)'
          });
        }
    
        // Vérifiez que l'utilisateur est défini
        if (!req.utilisateur || !req.utilisateur.userId) {
          return res.status(400).json({
            message: 'Utilisateur non défini ou identifiant utilisateur manquant'
          });
        }
    
        // Log des paramètres pour vérification
        console.log('Paramètres envoyés à l\'API:', {
          q: `${latitude}+${longitude}`,
          key: 'a8bed81fc2474a77b2f174abf82715c1' // Remplacez par votre clé API OpenCage
        });
    
        // Appel à l'API de géocodage inversé pour obtenir le lieu
        const response = await axios.get(
          'https://api.opencagedata.com/geocode/v1/json',
          {
            params: {
              q: `${latitude}+${longitude}`,
              key: 'a8bed81fc2474a77b2f174abf82715c1' // Remplacez par votre clé API OpenCage
            }
          }
        );
    
        // Log de la réponse complète pour diagnostic
        console.log('Réponse de l\'API:', response.data);
    
        // Vérifiez que la réponse contient des résultats
        if (response.data && response.data.results && response.data.results.length > 0) {
          const lieu = response.data.results[0].formatted;
    
          // Création de l'alerte
          const nouvelleAlerte = new Alerte({
            description,
            adresse: lieu,
            coordonnees: {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude)
            },
            photos: req.compressedFiles || [],
            declarant: req.utilisateur.userId
          });
    
          await nouvelleAlerte.save();
    
          // Enregistrer l'action dans l'historique
          await enregistrerAction(req.utilisateur._id, "A signalé un dépôt", req.utilisateur._id, "Signal de l'utilisateur");
    
          res.status(201).json({
            message: 'Alerte créée avec succès',
            alerte: {
              id: nouvelleAlerte._id,
              statut: nouvelleAlerte.statut,
              adresse: nouvelleAlerte.adresse,
            }
          });
        } else {
          return res.status(400).json({
            message: 'Impossible de récupérer le lieu à partir des coordonnées fournies.'
          });
        }
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
    const baseUrl = 'http://localhost:3000/api'; // Remplacez par l'URL de votre serveur
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





static async getNearbyDepots(req, res) {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude et longitude requises.' });
    }

    // Convertir les coordonnées en nombres
    const userLatitude = parseFloat(latitude);
    const userLongitude = parseFloat(longitude);

    // Récupérer les signaux à proximité (exemple : dans un rayon de 5 km)
    const nearbySignals = await Alerte.find({
      'coordonnees.latitude': { $gte: userLatitude - 0.05, $lte: userLatitude + 0.05 },
      'coordonnees.longitude': { $gte: userLongitude - 0.05, $lte: userLongitude + 0.05 }
    });

    // Calculer la distance entre l'utilisateur et chaque signal
    const signalsWithDistance = nearbySignals.map(signal => {
      const distance = AlerteController.calculateDistance(
        userLatitude,
        userLongitude,
        signal.coordonnees.latitude,
        signal.coordonnees.longitude
      );
      return { ...signal.toObject(), distance };
    });

    // Trier les signaux par distance
    signalsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json(signalsWithDistance);
  } catch (error) {
    console.error('Erreur lors de la récupération des signaux :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
}

// Fonction pour calculer la distance entre deux points en utilisant la formule de Haversine
static calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = AlerteController.deg2rad(lat2 - lat1);
  const dLon = AlerteController.deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(AlerteController.deg2rad(lat1)) * Math.cos(AlerteController.deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance en kilomètres
  return distance;
}

static deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// ... autres méthodes ...




// Lister les alertes de l'utilisateur connecté sous forme de méthode statique
static async getAlertesByUser(req, res) {
try {
  // Vérifier que l'objet utilisateur est bien défini
  if (!req.utilisateur || !req.utilisateur.userId) {
    return res.status(400).json({ message: "Utilisateur non défini ou identifiant utilisateur manquant" });
  }

  // Récupérer l'ID de l'utilisateur à partir du token
  const userId = req.utilisateur.userId;

  // Récupérer les alertes associées à l'utilisateur connecté
  const alertes = await Alerte.find({ declarant: userId }) // Filtrer par l'ID de l'utilisateur
    .populate("declarant", "nom email") // Ajouter des infos sur le déclarant
    .sort({ date: -1 }); // Trier par date décroissante

  // Vérifier si des alertes existent
  if (!alertes || alertes.length === 0) {
    return res.status(404).json({ message: "Aucune alerte trouvée pour cet utilisateur." });
  }
  const baseUrl = "http://localhost:3000/api"; // Base URL of your server
  alertes.forEach((alerte) => {
    if (alerte.photos && Array.isArray(alerte.photos)) {
      alerte.photos = alerte.photos.map((photo) => ({
        ...photo,
        chemin: `${baseUrl}/uploads${photo.chemin.replace("/alertes/compressed", "/alertes")}`,
      }));
    }
  });
  
  // Répondre avec les alertes modifiées
  res.status(200).json({
    message: "Alertes récupérées avec succès",
    alertes,
  });
} catch (error) {
  console.error("Erreur lors de la récupération des alertes:", error);
  res.status(500).json({
    message: "Erreur lors de la récupération des alertes",
    error: error.message, // Affichage du message d'erreur pour le diagnostic
  });
}
}




  }


module.exports = AlerteController;