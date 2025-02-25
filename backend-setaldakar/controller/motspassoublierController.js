//controller/motspassoublierController

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Utilisateur = require('../models/utilisateur.model');



//parie mots de passe oublier

// Configuration du transporteur d'emails (à adapter selon votre serveur SMTP)
const transporter = nodemailer.createTransport({
    service: 'gmail', // ou un autre service
    auth: {
      user: process.env.EMAIL_USER, // à définir dans votre .env
      pass: process.env.EMAIL_PASS  // à définir dans votre .env
    }
  });
  
  // Fonction pour générer un mot de passe aléatoire
  const generateTemporaryPassword = () => {
    // Génère un mot de passe de 8 caractères
    return crypto.randomBytes(4).toString('hex');
  };
  
  // Fonction pour gérer le mot de passe oublié
  exports.forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ message: "L'email est requis." });
      }
  
      // Vérifier si l'utilisateur existe
      const utilisateur = await Utilisateur.findOne({ email });
      if (!utilisateur) {
        return res.status(404).json({ message: "Aucun compte associé à cet email." });
      }
  
      // Générer un mot de passe temporaire
      const newPassword = generateTemporaryPassword();
      
      // Hasher le nouveau mot de passe
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Mettre à jour le mot de passe de l'utilisateur
      await Utilisateur.findByIdAndUpdate(utilisateur._id, { mot_passe: hashedPassword });
      
      // Envoyer l'email avec le nouveau mot de passe
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Réinitialisation de votre mot de passe - SetAlDakar',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #333;">Réinitialisation de votre mot de passe</h2>
            <p>Bonjour ${utilisateur.prenom} ${utilisateur.nom},</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre nouveau mot de passe temporaire :</p>
            <div style="background-color: #f5f5f5; padding: 10px; margin: 15px 0; font-family: monospace; font-size: 18px; text-align: center;">
              ${newPassword}
            </div>
            <p>Veuillez vous connecter avec ce mot de passe et le changer immédiatement pour des raisons de sécurité.<br><br></p>
            <p>Cordialement,<br>L'équipe SetalDakar</p>
          </div>
        `
      };
      
      // Envoyer l'email
      await transporter.sendMail(mailOptions);
      
      // Enregistrer l'action dans l'historique si la fonction existe
      if (typeof enregistrerAction === 'function') {
        await enregistrerAction({
          utilisateur: utilisateur._id,
          action: 'Réinitialisation de mot de passe',
          details: 'Mot de passe réinitialisé suite à une demande de récupération'
        });
      }
      
      res.json({ message: 'Un nouveau mot de passe a été envoyé à votre adresse email.' });
      
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  };