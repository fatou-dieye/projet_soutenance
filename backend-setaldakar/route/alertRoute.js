const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { verifyToken, verifyRole,invalidateToken } = require('../middlware/auth.middleware');
const depotController = require('../controllers/deposController');
// Route pour créer une nouvelle alerte
router.post('/alerts/create',verifyToken,verifyRole(['administrateur']), alertController.createAlert);

// Route pour lister toutes les alertes
router.get('/alerts',verifyToken,verifyRole(['administrateur']), alertController.getAlerts);

//pour les dopos

router.post('/depots', verifyToken,verifyRole(['administrateur']), depotController.createDepot);
router.get('/depots', verifyToken,verifyRole(['administrateur']), depotController.getDepots);

// Route pour traiter une alerte (mettre à jour le statut et envoyer un email au videur)
router.put('/alerts/:id',verifyToken,verifyRole(['administrateur']), alertController.updateAlert);

router.get('/daily-alert-count', verifyToken, verifyRole(['administrateur']), alertController.getDailyAlertCount);

// Nouvelle route pour confirmer la vidange (accessible sans authentification car utilisée depuis l'email)
router.get('/confirm-vidange/:id', alertController.confirmVidange);

module.exports = router;