const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const { verifyToken, verifyRole,invalidateToken } = require('../middlware/auth.middleware');

// Route pour récupérer les dernières données
router.get('/donnees', verifyToken, sensorController.getDernieresDonnees);


// Ajouter la nouvelle route pour correspondre à ce que le frontend attend
router.get('/dernieres-donnees', verifyToken, sensorController.getDernieresDonnees);

module.exports = router;