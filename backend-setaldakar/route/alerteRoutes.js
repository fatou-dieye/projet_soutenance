//alerteRoute
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { verifyToken, verifyRole } = require('../middlware/auth.middleware');
const Alerte = require('../models/Alerte');
const Utilisateur = require('../models/utilisateur.model');

// Configuration de multer pour l'upload des photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/alertes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `alerte-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seuls les fichiers image (JPEG, PNG, WEBP) sont autorisés'));
  }
});

// Middleware pour compresser les images
const compressImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }
    
    const compressedFiles = [];
    
    for (const file of req.files) {
      const filename = path.basename(file.path);
      const outputPath = path.join('uploads/alertes/compressed', filename);
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync('uploads/alertes/compressed')) {
        fs.mkdirSync('uploads/alertes/compressed', { recursive: true });
      }
      
      // Compresser l'image
      await sharp(file.path)
        .resize(800) // Redimensionner à max 800px de large
        .jpeg({ quality: 80 }) // Compression JPEG
        .toFile(outputPath);
      
      compressedFiles.push({
        chemin: `/alertes/compressed/${filename}`
      });
    }
    
    req.compressedFiles = compressedFiles;
    next();
  } catch (error) {
    next(error);
  }
};

// 1. CRÉER UNE ALERTE (pour les citoyens)
router.post('/alertes', 
  verifyToken, 
  upload.array('photos', 4),
  compressImages,
  async (req, res) => {
    try {
      const { titre, description, adresse, latitude, longitude, priorite } = req.body;
      
      // Validation des données
      if (!titre || !description || !adresse || !latitude || !longitude) {
        return res.status(400).json({ 
          message: 'Veuillez fournir toutes les informations nécessaires (titre, description, adresse, coordonnées)'
        });
      }
      
      // Création de l'alerte
      const nouvelleAlerte = new Alerte({
        titre,
        description,
        adresse,
        coordonnees: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        },
        photos: req.compressedFiles || [],
        priorite: priorite || 'Moyenne',
        declarant: req.utilisateur.userId
      });
      
      await nouvelleAlerte.save();
      
      res.status(201).json({
        message: 'Alerte créée avec succès',
        alerte: {
          id: nouvelleAlerte._id,
          titre: nouvelleAlerte.titre,
          statut: nouvelleAlerte.statut,
          adresse: nouvelleAlerte.adresse,
          priorite: nouvelleAlerte.priorite
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
);

// 2. RÉCUPÉRER TOUTES LES ALERTES (filtrage disponible)
router.get('/alertes', verifyToken, async (req, res) => {
  try {
    const { statut, priorite, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    // Appliquer les filtres si fournis
    if (statut) filter.statut = statut;
    if (priorite) filter.priorite = priorite;
    
    // Filtrage basé sur le rôle de l'utilisateur
    if (req.utilisateur.role === 'citoyen') {
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
      .populate('declarant', 'nom prenom telephone')
      .populate('chauffeurAssigne', 'nom prenom telephone');
    
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
});

// 3. RÉCUPÉRER UNE ALERTE PAR ID
router.get('/alertes/:id', verifyToken, async (req, res) => {
  try {
    const alerte = await Alerte.findById(req.params.id)
      .populate('declarant', 'nom prenom telephone email')
      .populate('chauffeurAssigne', 'nom prenom telephone email')
      .populate('commentaires.auteur', 'nom prenom role');
    
    if (!alerte) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }
    
    // Vérifier les permissions selon le rôle
    if (req.utilisateur.role === 'citoyen' && 
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
});

// 4. ASSIGNER UN CHAUFFEUR À UNE ALERTE (administrateurs seulement)
router.patch('/alertes/:id/assign', 
  verifyToken, 
  verifyRole(['administrateur']), 
  async (req, res) => {
    try {
      const { chauffeurId } = req.body;
      
      if (!chauffeurId) {
        return res.status(400).json({ message: 'ID du chauffeur requis' });
      }
      
      // Vérifier que le chauffeur existe et a le rôle approprié
      const chauffeur = await Utilisateur.findOne({ 
        _id: chauffeurId,
        role: 'videur'
      });
      
      if (!chauffeur) {
        return res.status(404).json({ message: 'Chauffeur non trouvé ou rôle incorrect' });
      }
      
      // Vérifier que l'alerte existe
      const alerte = await Alerte.findById(req.params.id);
      if (!alerte) {
        return res.status(404).json({ message: 'Alerte non trouvée' });
      }
      
      // Mettre à jour l'alerte
      alerte.chauffeurAssigne = chauffeurId;
      alerte.statut = 'En cours';
      alerte.dateAssignation = new Date();
      
      await alerte.save();
      
      res.json({
        message: 'Chauffeur assigné avec succès',
        alerte: {
          id: alerte._id,
          statut: alerte.statut,
          chauffeurAssigne: chauffeurId
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de l\'assignation du chauffeur', 
        error: error.message 
      });
    }
  }
);

// 5. METTRE À JOUR LE STATUT D'UNE ALERTE (pour chauffeurs et admins)
router.patch('/alertes/:id/status', 
  verifyToken, 
  verifyRole(['administrateur', 'videur']), 
  async (req, res) => {
    try {
      const { statut, commentaire } = req.body;
      
      if (!statut) {
        return res.status(400).json({ message: 'Statut requis' });
      }
      
      // Vérifier que le statut est valide
      if (!['Non traité', 'En cours', 'Traité', 'Annulé'].includes(statut)) {
        return res.status(400).json({ message: 'Statut invalide' });
      }
      
      // Récupérer l'alerte
      const alerte = await Alerte.findById(req.params.id);
      if (!alerte) {
        return res.status(404).json({ message: 'Alerte non trouvée' });
      }
      
      // Vérifier que le chauffeur est bien assigné à l'alerte
      if (req.utilisateur.role === 'videur' && 
          alerte.chauffeurAssigne?.toString() !== req.utilisateur.userId) {
        return res.status(403).json({ 
          message: 'Vous n\'êtes pas autorisé à modifier cette alerte' 
        });
      }
      
      // Mettre à jour le statut
      alerte.statut = statut;
      
      // Si statut "Traité", enregistrer la date de traitement
      if (statut === 'Traité') {
        alerte.dateTraitement = new Date();
      }
      
      // Ajouter un commentaire si fourni
      if (commentaire) {
        alerte.commentaires.push({
          auteur: req.utilisateur.userId,
          texte: commentaire
        });
      }
      
      await alerte.save();
      
      res.json({
        message: 'Statut mis à jour avec succès',
        alerte: {
          id: alerte._id,
          statut: alerte.statut,
          dateTraitement: alerte.dateTraitement
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la mise à jour du statut', 
        error: error.message 
      });
    }
  }
);

// 6. AJOUTER UN COMMENTAIRE À UNE ALERTE
router.post('/alertes/:id/commentaires', verifyToken, async (req, res) => {
  try {
    const { commentaire } = req.body;
    
    if (!commentaire) {
      return res.status(400).json({ message: 'Commentaire requis' });
    }
    
    const alerte = await Alerte.findById(req.params.id);
    if (!alerte) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }
    
    // Vérifier les permissions selon le rôle
    if (req.utilisateur.role === 'citoyen' && 
        alerte.declarant.toString() !== req.utilisateur.userId) {
      return res.status(403).json({ 
        message: 'Vous n\'êtes pas autorisé à commenter cette alerte' 
      });
    }
    
    if (req.utilisateur.role === 'videur' && 
        alerte.chauffeurAssigne?.toString() !== req.utilisateur.userId) {
      return res.status(403).json({ 
        message: 'Vous n\'êtes pas autorisé à commenter cette alerte' 
      });
    }
    
    // Ajouter le commentaire
    alerte.commentaires.push({
      auteur: req.utilisateur.userId,
      texte: commentaire
    });
    
    await alerte.save();
    
    // Récupérer le commentaire avec les infos de l'auteur
    const nouveauCommentaire = alerte.commentaires[alerte.commentaires.length - 1];
    await Alerte.populate(alerte, {
      path: 'commentaires.auteur',
      select: 'nom prenom role',
      match: { _id: nouveauCommentaire.auteur }
    });
    
    res.status(201).json({
      message: 'Commentaire ajouté avec succès',
      commentaire: nouveauCommentaire
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de l\'ajout du commentaire', 
      error: error.message 
    });
  }
});

// 7. RÉCUPÉRER LES ALERTES PROCHES (pour les chauffeurs)
router.get('/alertes-proches', 
  verifyToken, 
  verifyRole(['videur', 'administrateur']), 
  async (req, res) => {
    try {
      const { latitude, longitude, distance = 5 } = req.query; // distance en km
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          message: 'Coordonnées de géolocalisation requises (latitude, longitude)' 
        });
      }
      
      // Conversion de la distance en degrés (approximation)
      // 1 degré = environ 111 km à l'équateur
      const distanceDegrees = parseFloat(distance) / 111;
      
      // Recherche des alertes dans la zone spécifiée, non traitées
      const alertesProches = await Alerte.find({
        statut: 'Non traité',
        'coordonnees.latitude': {
          $gte: parseFloat(latitude) - distanceDegrees,
          $lte: parseFloat(latitude) + distanceDegrees
        },
        'coordonnees.longitude': {
          $gte: parseFloat(longitude) - distanceDegrees,
          $lte: parseFloat(longitude) + distanceDegrees
        }
      })
      .populate('declarant', 'nom prenom telephone')
      .sort({ priorite: -1, dateCreation: 1 }); // Priorité haute d'abord, puis plus anciennes
      
      res.json(alertesProches);
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des alertes proches', 
        error: error.message 
      });
    }
  }
);

// 8. TABLEAU DE BORD / STATISTIQUES (pour les administrateurs)
router.get('/dashboard', 
  verifyToken, 
  verifyRole(['administrateur']), 
  async (req, res) => {
    try {
      // Comptage par statut
      const statuts = await Alerte.aggregate([
        { $group: { _id: '$statut', count: { $sum: 1 } } }
      ]);
      
      // Comptage par priorité
      const priorites = await Alerte.aggregate([
        { $group: { _id: '$priorite', count: { $sum: 1 } } }
      ]);
      
      // Alertes récentes
      const alertesRecentes = await Alerte.find()
        .sort({ dateCreation: -1 })
        .limit(5)
        .populate('declarant', 'nom prenom')
        .populate('chauffeurAssigne', 'nom prenom');
      
      // Temps moyen de traitement (en heures)
      const tempsTraitement = await Alerte.aggregate([
        { $match: { statut: 'Traité', dateTraitement: { $exists: true } } },
        { 
          $project: {
            duree: { 
              $divide: [
                { $subtract: ['$dateTraitement', '$dateCreation'] },
                3600000 // convertir ms en heures
              ]
            }
          }
        },
        { $group: { _id: null, moyenne: { $avg: '$duree' } } }
      ]);
      
      // Performance des chauffeurs
      const performanceChauffeurs = await Alerte.aggregate([
        { $match: { statut: 'Traité', chauffeurAssigne: { $exists: true } } },
        { $group: { 
          _id: '$chauffeurAssigne', 
          count: { $sum: 1 },
          tempsTraitementMoyen: { 
            $avg: { 
              $divide: [
                { $subtract: ['$dateTraitement', '$dateAssignation'] },
                3600000
              ] 
            }
          }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      // Compléter avec les noms des chauffeurs
      const chauffeurIds = performanceChauffeurs.map(item => item._id);
      const chauffeurs = await Utilisateur.find(
        { _id: { $in: chauffeurIds } },
        { nom: 1, prenom: 1 }
      );
      
      // Mapper les noms de chauffeurs
      const chauffeurMap = {};
      chauffeurs.forEach(c => {
        chauffeurMap[c._id] = `${c.prenom} ${c.nom}`;
      });
      
      const performanceComplete = performanceChauffeurs.map(item => ({
        chauffeurId: item._id,
        nomChauffeur: chauffeurMap[item._id] || 'Inconnu',
        alertesTraitees: item.count,
        tempsTraitementMoyen: item.tempsTraitementMoyen
      }));
      
      res.json({
        statistiques: {
          total: await Alerte.countDocuments(),
          parStatut: statuts,
          parPriorite: priorites,
          tempsTraitementMoyen: tempsTraitement[0]?.moyenne || 0
        },
        performanceChauffeurs: performanceComplete,
        alertesRecentes
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des statistiques', 
        error: error.message 
      });
    }
  }
);

module.exports = router;