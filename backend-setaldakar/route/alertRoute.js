const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { verifyToken, verifyRole,invalidateToken } = require('../middlware/auth.middleware');
// Route pour créer une nouvelle alerte
router.post('/alerts/create',verifyToken,verifyRole(['administrateur']), alertController.createAlert);

// Route pour lister toutes les alertes
router.get('/alerts',verifyToken,verifyRole(['administrateur']), alertController.getAlerts);

// Route pour traiter une alerte (mettre à jour le statut et envoyer un email au videur)
router.put('/alerts/:id',verifyToken,verifyRole(['administrateur']), alertController.updateAlert);


module.exports = router;