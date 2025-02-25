const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// Route pour créer une nouvelle alerte
router.post('/alerts/create', alertController.createAlert);

// Route pour lister toutes les alertes
router.get('/alerts', alertController.getAlerts);

// Route pour traiter une alerte (mettre à jour le statut et envoyer un email au videur)
router.put('/alerts/:id', alertController.updateAlert);


module.exports = router;
