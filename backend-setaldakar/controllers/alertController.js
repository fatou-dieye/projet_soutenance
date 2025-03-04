const Alert = require('../models/Alert');
const nodemailer = require('nodemailer');
const GeolocationService = require('../services/geolocation.service');
const Depot = require('../models/depos');
const User = require('../models/Utilisateur'); // Assurez-vous que le chemin est correct

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
    
    // Envoyer un email au videur avec l'itinéraire
    await sendTaskEmail(alert, employee_email, itineraire);
    
    // Mettre à jour le statut de l'alerte
    alert.status = status || 'en traitement';
    await alert.save();
    
    res.json({ message: 'Alerte assignée avec succès', alert });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Fonction pour envoyer un email de tâche au videur
const sendTaskEmail = (alert, employee_email, itineraire) => {
  return new Promise((resolve, reject) => {
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
      from: 'fatoujeey2001@gmail.com',
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
              margin-top: 10px;">L'itinéraire sur Google Maps</a>
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
