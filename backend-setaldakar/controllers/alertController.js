const Alert = require('../models/Alert');
const nodemailer = require('nodemailer');
const GeolocationService = require('../services/geolocation.service');

// Créer une nouvelle alerte
exports.createAlert = async (req, res) => {
  try {
    const alert = new Alert({
      adresse: req.body.adresse,
      coordonnees: {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude)
      },
      niveau: req.body.niveau,
      date: req.body.date,
      heure: req.body.heure,
      bac_id: req.body.bac_id
    });

    await alert.save();
    res.status(201).json({ message: 'Alerte créée avec succès', alert });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lister toutes les alertes
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.json(alerts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Traiter une alerte (mettre à jour le statut et envoyer un email au videur)
exports.updateAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }

    // Envoyer un email au videur
    await sendTaskEmail(alert, req.body.employee_email);

    // Mettre à jour le statut de l'alerte
    alert.status = 'traité';
    await alert.save();

    res.json({ message: 'Alerte traitée avec succès', alert });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Fonction pour envoyer un email de tâche au videur
const sendTaskEmail = (alert, employee_email) => {
    return new Promise((resolve, reject) => {
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'fatoujeey2001@gmail.com',
          pass: 'nqtp vkhf jers mpyf' // Utilisez le mot de passe d'application ici
        }
      });
  
      let mailOptions = {
        from: 'fatoujeey2001@gmail.com',
        to: employee_email,
        subject: 'Nouvelle Alerte de Vidange',
        text: `Bonjour,
  
  Une nouvelle tâche de vidange vous a été assignée :
  
  📍 **Adresse** : ${alert.adresse} 
  **Coordonnées** : ${alert.coordonnees.latitude}, ${alert.coordonnees.longitude}
  📏 **Niveau** : ${alert.niveau}
  📅 **Date** : ${alert.date}
  ⏰ **Heure** : ${alert.heure}
  🆔 **ID du Bac** : ${alert.bac_id}
  
  Merci de traiter cette alerte dès que possible.
  
  Cordialement,
  L'équipe de gestion`
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Erreur d'envoi d'email :", error);
          return reject(error);
        }
        console.log('Email envoyé: ' + info.response);
        resolve();
      });
    });
  };
  
