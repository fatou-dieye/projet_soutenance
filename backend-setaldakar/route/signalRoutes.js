//route/alerteRoute
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { verifyToken, verifyRole } = require('../middleware/authmiddleware');
const Alerte = require('../models/Signal');
const Utilisateur = require('../models/Utilisateur');
const AlerteController = require('../controllers/signalController');
const  getNearbyDepots  = require('../controllers/signalController');
const getAlertesByUser  = require('../controllers/signalController');

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
router.post('/alertes/create', 
  verifyToken, 
  upload.array('photos', 4),
  compressImages,
  AlerteController.createAlerte
);

// 2. RÉCUPÉRER TOUTES LES ALERTES (filtrage disponible)
router.get('/alertes', verifyToken, AlerteController.getAlertes);

// 3. RÉCUPÉRER UNE ALERTE PAR ID
router.get('/alertes/:id', verifyToken, AlerteController.getAlerteById);


router.get('/nearby-depots', verifyToken, AlerteController.getNearbyDepots);

// Route pour récupérer les alertes par utilisateur
router.get('/alertesbyuser', verifyToken, AlerteController.getAlertesByUser);

module.exports = router;