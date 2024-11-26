// controllers/mesure.controller.js
const Mesure = require('../models/mesure.model');

class MesureController {
  // Enregistrer une nouvelle mesure
  static async creerMesure(req, res) {
    try {
      const { temperature, humidite } = req.body;
      const heures = [10, 14, 17];
      const maintenant = new Date();
      const heureActuelle = maintenant.getHours();
      let heurePrevue = heures.includes(heureActuelle) ? `${heureActuelle}:00` : null;

      const mesure = new Mesure({
        temperature,
        humidite,
        horodatage: maintenant,
        heurePrevue,
        etatVentilateur: temperature > 27,
        alerteTemperature: temperature > 27
      });

      await mesure.save();

      res.status(201).json({
        success: true,
        message: 'Mesure enregistrée avec succès',
        mesure
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement',
        error: error.message
      });
    }
  }

  // Récupérer la dernière mesure
  static async getDerniereMesure(req, res) {
    try {
      const mesure = await Mesure.findOne().sort('-horodatage');

      if (!mesure) {
        return res.status(404).json({
          success: false,
          message: 'Aucune mesure trouvée'
        });
      }

      const etatSysteme = {
        alerteActive: mesure.alerteTemperature,
        ventilationActive: mesure.etatVentilateur,
        derniereMiseAJour: mesure.horodatage
      };

      res.json({
        success: true,
        mesure,
        etatSysteme
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération',
        error: error.message
      });
    }
  }

  // Récupérer les mesures aux heures spécifiques
  static async getMesuresHeuresSpecifiques(req, res) {
    try {
      const { date } = req.params;
      const heuresSpecifiques = [10, 14, 17];
      const mesures = [];
      const maintenant = new Date();
      const dateRequete = new Date(date);
      const estAujourdhui = dateRequete.toDateString() === maintenant.toDateString();
      const heureActuelle = maintenant.getHours();

      for (const heure of heuresSpecifiques) {
        const debutHeure = new Date(date);
        debutHeure.setHours(heure, 0, 0, 0);
        const finHeure = new Date(date);
        finHeure.setHours(heure, 59, 59, 999);

        let mesure = null;
        let statut;

        if (estAujourdhui && heureActuelle < heure) {
          statut = 'à venir';
        } else {
          mesure = await Mesure.findOne({
            horodatage: { $gte: debutHeure, $lte: finHeure }
          });
          statut = mesure ? 'mesuré' : 'non mesuré';
        }

        mesures.push({
          heure: `${heure}:00`,
          donnees: mesure,
          statut
        });
      }

      res.json({
        success: true,
        date,
        mesures,
        metadata: {
          total: mesures.length,
          mesuresEffectuees: mesures.filter(m => m.statut === 'mesuré').length,
          mesuresManquees: mesures.filter(m => m.statut === 'non mesuré').length,
          mesuresRestantes: mesures.filter(m => m.statut === 'à venir').length,
          estAujourdhui
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération',
        error: error.message
      });
    }
  }

  // Moyennes journalières
  static async getMoyennesJournalieres(req, res) {
    try {
      const { date } = req.params;
      const debutJour = new Date(date);
      debutJour.setHours(0, 0, 0, 0);
      const finJour = new Date(date);
      finJour.setHours(23, 59, 59, 999);

      const stats = await Mesure.aggregate([
        {
          $match: {
            horodatage: { $gte: debutJour, $lte: finJour }
          }
        },
        {
          $group: {
            _id: null,
            temperatureMoyenne: { $avg: "$temperature" },
            humiditeMoyenne: { $avg: "$humidite" },
            maxTemperature: { $max: "$temperature" },
            minTemperature: { $min: "$temperature" },
            nombreMesures: { $sum: 1 },
            alertes: { 
              $sum: { $cond: [{ $eq: ["$alerteTemperature", true] }, 1, 0] }
            },
            ventilationActive: {
              $sum: { $cond: [{ $eq: ["$etatVentilateur", true] }, 1, 0] }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return res.json({
          success: true,
          message: 'Aucune mesure pour cette date',
          date,
          statistiques: null
        });
      }

      res.json({
        success: true,
        date,
        statistiques: {
          temperature: {
            moyenne: Number(stats[0].temperatureMoyenne.toFixed(1)),
            max: stats[0].maxTemperature,
            min: stats[0].minTemperature
          },
          humidite: {
            moyenne: Number(stats[0].humiditeMoyenne.toFixed(1))
          },
          alertes: stats[0].alertes,
          ventilation: {
            dureeActivation: stats[0].ventilationActive,
            pourcentage: Number((stats[0].ventilationActive / stats[0].nombreMesures * 100).toFixed(1))
          },
          nombreMesures: stats[0].nombreMesures
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du calcul des statistiques',
        error: error.message
      });
    }
  }

  // Contrôler le ventilateur
  static async controlerVentilateur(req, res) {
    try {
      const { etat, temperature, humidite } = req.body;

      const mesure = new Mesure({
        temperature,
        humidite,
        etatVentilateur: etat,
        alerteTemperature: temperature > 27
      });

      await mesure.save();

      res.json({
        success: true,
        message: `Ventilateur ${etat ? 'activé' : 'désactivé'} avec succès`,
        mesure,
        alerte: temperature > 27 ? {
          type: 'temperature',
          message: 'Température critique détectée !'
        } : null
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du contrôle du ventilateur',
        error: error.message
      });
    }
  }

   // Récupérer les mesures d'un jour spécifique
   static async getMesuresJour(req, res) {
    try {
      const { date } = req.params;
      const debutJour = new Date(date);
      debutJour.setHours(0, 0, 0, 0);
      const finJour = new Date(date);
      finJour.setHours(23, 59, 59, 999);

      const stats = await Mesure.aggregate([
        {
          $match: {
            horodatage: { $gte: debutJour, $lte: finJour }
          }
        },
        {
          $group: {
            _id: null,
            mesures: { $push: "$$ROOT" },
            temperatureMoyenne: { $avg: "$temperature" },
            humiditeMoyenne: { $avg: "$humidite" },
            maxTemperature: { $max: "$temperature" },
            minTemperature: { $min: "$temperature" },
            nombreMesures: { $sum: 1 },
            alertes: { 
              $sum: { $cond: [{ $eq: ["$alerteTemperature", true] }, 1, 0] }
            },
            ventilationActive: {
              $sum: { $cond: [{ $eq: ["$etatVentilateur", true] }, 1, 0] }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return res.json({
          success: true,
          message: 'Aucune mesure pour cette date',
          date,
          mesures: []
        });
      }

      res.json({
        success: true,
        date,
        mesures: stats[0].mesures,
        statistiques: {
          temperature: {
            moyenne: Number(stats[0].temperatureMoyenne.toFixed(1)),
            max: stats[0].maxTemperature,
            min: stats[0].minTemperature
          },
          humidite: {
            moyenne: Number(stats[0].humiditeMoyenne.toFixed(1))
          },
          alertes: stats[0].alertes,
          ventilation: {
            duree: stats[0].ventilationActive,
            nombreMesures: stats[0].nombreMesures
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des mesures du jour',
        error: error.message
      });
    }
  }

   // Récupérer l'historique de la semaine
   static async getHistoriqueSemaine(req, res) {
    try {
      const maintenant = new Date();
      const debutSemaine = new Date(maintenant);
      debutSemaine.setDate(maintenant.getDate() - 7);

      const historique = await Mesure.aggregate([
        {
          $match: {
            horodatage: { $gte: debutSemaine, $lte: maintenant }
          }
        },
        {
          $group: {
            _id: { 
              $dateToString: { format: "%Y-%m-%d", date: "$horodatage" } 
            },
            mesures: { $push: {
              temperature: "$temperature",
              humidite: "$humidite",
              horodatage: "$horodatage",
              heurePrevue: "$heurePrevue",
              etatVentilateur: "$etatVentilateur",
              alerteTemperature: "$alerteTemperature"
            }},
            nombreMesures: { $sum: 1 }
          }
        },
        {
          $sort: { "_id": 1 }
        }
      ]);

      res.json({
        success: true,
        periode: {
          debut: debutSemaine,
          fin: maintenant
        },
        historique: historique.map(jour => ({
          date: jour._id,
          mesures: jour.mesures,
          nombreMesures: jour.nombreMesures
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'historique',
        error: error.message
      });
    }
  }
}

module.exports = MesureController;