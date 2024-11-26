// routes/mesure.routes.js
const express = require('express');
const router = express.Router();
const MesureController = require('../controllers/mesure.controller');
const { verifierToken, verifierAdmin } = require('../middleware/auth');

// Créer une mesure
router.post('/', verifierToken, MesureController.creerMesure);

// Obtenir la dernière mesure
router.get('/derniere', verifierToken, MesureController.getDerniereMesure);

// Obtenir les mesures d'un jour spécifique
router.get('/jour/:date', verifierToken, MesureController.getMesuresJour);

// Obtenir les mesures aux heures spécifiques (10h, 14h, 17h)
router.get('/heures-specifiques/:date', verifierToken, MesureController.getMesuresHeuresSpecifiques);

// Obtenir les moyennes journalières
router.get('/moyennes/:date', verifierToken, MesureController.getMoyennesJournalieres);

// Obtenir l'historique de la semaine
router.get('/historique', verifierToken, MesureController.getHistoriqueSemaine);

// Contrôler le ventilateur (admin uniquement)
router.post('/ventilateur', [verifierToken, verifierAdmin], MesureController.controlerVentilateur);

module.exports = router;