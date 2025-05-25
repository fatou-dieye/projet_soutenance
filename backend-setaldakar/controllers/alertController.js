const Alert = require('../models/Alert');
const nodemailer = require('nodemailer');
const GeolocationService = require('../services/geolocation.service');
const Depot = require('../models/depos');
const User = require('../models/Utilisateur'); // Assurez-vous que le chemin est correct
const moment = require('moment');
// Créer une nouvelle alerte
exports.createAlert = async (req, res) => {
  try {
    const { depot_id, niveau } = req.body;

    // Vérifiez si le dépôt existe
    const depot = await Depot.findById(depot_id);
    if (!depot) {
      return res.status(404).json({ message: 'Dépôt non trouvé' });
    }

    const alert = new Alert({
      depot_id,
      niveau,
      date: new Date(), // Définir la date actuelle
      heure: new Date().toLocaleTimeString() // Définir l'heure actuelle
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
    const alerts = await Alert.find().populate('depot_id', 'lieu coordonnees');
    res.json(alerts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};




// Récupérer le nombre d'alertes pour un jour donné
exports.getDailyAlertCount = async (req, res) => {
  try {
    const today = moment().startOf('day');
    const tomorrow = moment(today).add(1, 'days');

    const count = await Alert.countDocuments({
      date: {
        $gte: today.toDate(),
        $lt: tomorrow.toDate()
      }
    });

    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du nombre d\'alertes' });
  }
};

// Traiter une alerte (mettre à jour le statut et envoyer un email au videur)
exports.updateAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id).populate('depot_id', 'lieu coordonnees');
    if (!alert) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }
    
    // Récupérer l'email du videur à partir du corps de la requête
    const { employee_email, status } = req.body;
    
    // Vérifier si le videur existe
    const videur = await User.findOne({ email: employee_email, role: 'videur' });
    if (!videur) {
      return res.status(404).json({ message: 'Videur non trouvé' });
    }
    
    // Générer un itinéraire ou des instructions pour le videur
    let itineraire = '';
    try {
      // Obtenir l'adresse formatée à partir des coordonnées
      const adresseFormatee = await GeolocationService.getAddressFromCoordinates(
        alert.depot_id.coordonnees.latitude, 
        alert.depot_id.coordonnees.longitude
      );
      
      // Créer un lien Google Maps pour l'itinéraire
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${alert.depot_id.coordonnees.latitude},${alert.depot_id.coordonnees.longitude}`;
      
      itineraire = `
        Adresse complète: ${adresseFormatee}
        
        Pour obtenir l'itinéraire, cliquez sur ce lien: ${mapsUrl}
      `;
    } catch (error) {
      console.error('Erreur lors de la génération de l\'itinéraire:', error);
      itineraire = `
        Coordonnées GPS: ${alert.depot_id.coordonnees.latitude}, ${alert.depot_id.coordonnees.longitude}
        Vous pouvez utiliser ces coordonnées dans votre application GPS préférée.
      `;
    }
    
    // Envoyer un email au videur avec l'itinéraire et le lien de confirmation
    await sendTaskEmail(alert, employee_email, itineraire);
    
    // Mettre à jour le statut de l'alerte
    alert.status = status || 'en traitement';
    await alert.save();
    
    res.json({ message: 'Alerte assignée avec succès', alert });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Confirmer la vidange (endpoint appelé depuis l'email)
exports.confirmVidange = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Rechercher l'alerte par ID
    const alert = await Alert.findById(id);
    
    if (!alert) {
      return res.status(404).send(`
        <html>
          <head>
            <title>Confirmation de vidange</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .error { color: red; }
            </style>
          </head>
          <body>
            <h1 class="error">Erreur</h1>
            <p>Alerte non trouvée.</p>
          </body>
        </html>
      `);
    }
    
    // Mettre à jour le statut de l'alerte
    if (alert.status === 'en traitement') {
      alert.status = 'traité';
      await alert.save();
      
      // Retourner une page de confirmation HTML
      return res.status(200).send(`
        <html>
          <head>
            <title>Confirmation de vidange</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .success { color: green; }
            </style>
          </head>
          <body>
            <h1 class="success">Vidange confirmée avec succès!</h1>
            <p>Le statut de l'alerte a été mis à jour de "en traitement" à "traité".</p>
          </body>
        </html>
      `);
    } else {
      return res.status(400).send(`
        <html>
          <head>
            <title>Confirmation de vidange</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .warning { color: orange; }
            </style>
          </head>
          <body>
            <h1 class="warning">Pas de mise à jour nécessaire</h1>
            <p>Cette alerte n'est pas en cours de traitement ou a déjà été traitée.</p>
            <p>Statut actuel: ${alert.status}</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Erreur lors de la confirmation de vidange:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Confirmation de vidange</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h1 class="error">Erreur</h1>
          <p>Une erreur s'est produite lors de la confirmation de la vidange.</p>
        </body>
      </html>
    `);
  }
};

// Fonction pour envoyer un email de tâche au videur
const sendTaskEmail = (alert, employee_email, itineraire) => {
  return new Promise((resolve, reject) => {
    // Construire l'URL de confirmation avec l'ID de l'alerte
    const confirmationUrl = `${process.env.API_BASE_URL || 'http://localhost:3000/api'}/api/confirm-vidange/${alert._id}`;
    
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'fatoujeey2001@gmail.com',
        pass: 'nqtp vkhf jers mpyf' // Utilisez le mot de passe d'application ici
      }
    });
    
    // Lien Google Maps pour l'itinéraire
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${alert.depot_id.coordonnees.latitude},${alert.depot_id.coordonnees.longitude}`;

    let mailOptions = {
      from: 'SETALDAKAR',
      to: employee_email,
      subject: 'Nouvelle Mission de Vidange',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #00a651;">Nouvelle Mission de Vidange</h2>
          <p>Bonjour,</p>
          <p>Une nouvelle tâche de vidange vous a été assignée :</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>📍 Adresse :</strong> ${alert.depot_id.lieu}</p>
            <p><strong>🌍 Coordonnées :</strong> ${alert.depot_id.coordonnees.latitude}, ${alert.depot_id.coordonnees.longitude}</p>
            <p><strong>📏 Niveau de remplissage :</strong> ${alert.niveau}%</p>
            <p><strong>📅 Date :</strong> ${new Date(alert.date).toLocaleDateString()}</p>
            <p><strong>⏰ Heure :</strong> ${alert.heure}</p>
          </div>
          
          <div style="background-color: #e0f7e9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Instructions :</strong></p>
            <div style="margin: 10px 0;">
              <!-- Ajouter le bouton avec un lien vers Google Maps -->
              <a href="${mapsUrl}" target="_blank" style="
                display: inline-block; 
                background-color: #4CAF50; 
                color: white; 
                padding: 10px 20px; 
                text-align: center; 
                border-radius: 5px; 
                text-decoration: none; 
                font-size: 16px; 
                margin-right: 10px;">L'itinéraire sur Google Maps</a>
                
                
              <!-- Bouton de confirmation de vidange -->
              <a href="${confirmationUrl}" target="_blank" style="
                display: inline-block; 
                background-color: #2196F3; 
                color: white; 
                padding: 10px 20px; 
                text-align: center; 
                border-radius: 5px; 
                text-decoration: none; 
                font-size: 16px; 
                margin-top: 10px;">Confirmer la vidange</a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 15px;">
              <i>Cliquez sur "Confirmer la vidange" une fois que vous avez terminé la mission pour mettre à jour son statut.</i>
            </p>
          </div>
          
          <p>Merci de traiter cette alerte dès que possible.</p>
          <p>Cordialement,<br>L'équipe de gestion</p>
        </div>
      `
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