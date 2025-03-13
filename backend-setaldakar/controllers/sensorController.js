
const sensorService = require('../services/sensorService');

class SensorController {
  // Méthode pour récupérer les dernières données
  getDernieresDonnees(req, res) {
    try {
      const donnees = sensorService.getLatestData();
      res.json(donnees);
    } catch (error) {
      res.status(500).json({ 
        message: "Erreur lors de la récupération des données", 
        error: error.message 
      });
    }
  }

   // Optionnel: méthode pour forcer une vérification manuelle
   async forceAlertCheck(req, res) {
    try {
      const data = sensorService.getLatestData();
      if (data.pourcentage) {
        await sensorService.checkThresholdAndCreateAlert(data);
        res.json({ message: "Vérification d'alerte effectuée", niveau: data.pourcentage });
      } else {
        res.status(400).json({ message: "Aucune donnée de capteur disponible" });
      }
    } catch (error) {
      res.status(500).json({
        message: "Erreur lors de la vérification d'alerte",
        error: error.message
      });
    }
  }
}

module.exports = new SensorController();