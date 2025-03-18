const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Utilisateur = require('../models/Utilisateur');

// Fonction pour envoyer un email
const sendResetEmail = async (email, token) => {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER_1,
      pass: process.env.EMAIL_PASS_1
    }
  });

  const resetLink = `http://localhost:4200/reset-password?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER_1,
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px;">Réinitialiser le mot de passe</a>
      <p>Si vous n'avez pas demandé de réinitialisation de mot de passe, veuillez ignorer cet email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email envoyé à ${email} avec le token ${token}`);
  } catch (error) {
    console.error(`Erreur lors de l'envoi de l'email: ${error}`);
    throw new Error('Erreur lors de l\'envoi de l\'email de réinitialisation');
  }
};

exports.requestResetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const utilisateur = await Utilisateur.findOne({ email });

    if (!utilisateur) {
      console.log(`Aucun utilisateur trouvé avec l'email ${email}`);
      return res.status(404).json({ message: 'Aucun utilisateur trouvé avec cet email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = Date.now() + 3600000; // 1 heure

    utilisateur.resetPasswordToken = resetToken;
    utilisateur.resetPasswordExpires = resetExpires;

    console.log(`Token généré: ${resetToken}`);
    console.log(`Expiration du token: ${new Date(resetExpires).toISOString()}`);

    await utilisateur.save();
    console.log(`Utilisateur ${utilisateur.email} mis à jour avec le token ${resetToken}`);

    // Vérifiez que le token est bien enregistré dans la base de données
    const updatedUtilisateur = await Utilisateur.findOne({ email });
    console.log(`Token enregistré dans la base de données: ${updatedUtilisateur.resetPasswordToken}`);
    console.log(`Expiration du token enregistré dans la base de données: ${new Date(updatedUtilisateur.resetPasswordExpires).toISOString()}`);

    await sendResetEmail(email, resetToken);

    res.status(200).json({ message: 'Email de réinitialisation vous a ete envoyé' });
  } catch (error) {
    console.error(`Erreur lors de la demande de réinitialisation: ${error.message}`);
    res.status(500).json({ message: 'Erreur lors de la demande de réinitialisation', error: error.message });
  }
};

(exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.query; // Extrait le token des paramètres de requête
    const { newPassword, confirmPassword } = req.body;

    // Vérification si le token est présent
    if (!token) {
      return res.status(400).json({ message: 'Token manquant dans la requête.' });
    }

    // Vérification si les mots de passe correspondent
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas.' });
    }

    // Recherche de l'utilisateur avec le token et vérification de l'expiration
    const utilisateur = await Utilisateur.findOne({
      resetPasswordToken: token.trim(),
      resetPasswordExpires: { $gt: Date.now() } // Vérifie que le token n'est pas expiré
    });

    // Si l'utilisateur n'est pas trouvé ou si le token est expiré
    if (!utilisateur) {
      return res.status(400).json({
        message: 'Token invalide ou expiré. Vous ne pouvez plus réinitialiser votre mot de passe avec ce lien.'
      });
    }

    // Si le token a déjà été utilisé (token existe mais utilisateur a déjà réinitialisé son mot de passe)
    if (!utilisateur.resetPasswordToken || utilisateur.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        message: 'Ce lien de réinitialisation de mot de passe a déjà été utilisé ou a expiré.'
      });
    }

    // Si le token est valide et non utilisé, procéder à la réinitialisation du mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`Mot de passe haché : ${hashedPassword}`);

    // Mise à jour de l'utilisateur avec le nouveau mot de passe et suppression du token
    const updatedUtilisateur = await Utilisateur.findOneAndUpdate(
      { _id: utilisateur._id },
      {
        $set: {
          mot_passe: hashedPassword, // Mise à jour du mot de passe
          resetPasswordToken: null,  // Suppression du token de réinitialisation
          resetPasswordExpires: null // Suppression de la date d'expiration du token
        }
      },
      { new: true } // Retourner l'utilisateur mis à jour
    );

    // Vérification si le token a bien été supprimé
    if (updatedUtilisateur.resetPasswordToken === null) {
      console.log(`Token supprimé avec succès pour l'utilisateur : ${updatedUtilisateur.email}`);
    } else {
      console.error(`Le token n'a pas été supprimé pour l'utilisateur : ${updatedUtilisateur.email}`);
      return res.status(500).json({ message: 'Erreur interne : Le token n\'a pas été supprimé de la base de données.' });
    }

    console.log("Mot de passe mis à jour avec succès pour l'utilisateur :", utilisateur.email);

    // Réponse de succès
    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe : ", error);

    // Vérification des erreurs spécifiques
    if (error.message.includes('Token invalide ou expiré')) {
      return res.status(400).json({ message: 'Token invalide ou expiré. Vous ne pouvez plus réinitialiser votre mot de passe avec ce lien.' });
    }
    if (error.message.includes('Ce lien de réinitialisation de mot de passe a déjà été utilisé ou a expiré.')) {
      return res.status(400).json({ message: 'Ce lien de réinitialisation de mot de passe a déjà été utilisé ou a expiré.' });
    }

    // Autres erreurs génériques
    return res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer.' });
  }
});


 


