const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Créer un transporter réutilisable
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

class EmailDeposSauvagesService {
  static async envoyerEmailDeposSauvage(signalement, videur) {
    const { _id, adresse, coordonnees, description, dateSignalement, photos = [] } = signalement;
    const mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${coordonnees.latitude},${coordonnees.longitude}&travelmode=driving`;
    const confirmationLink = `https://projet-soutenance-y3d8.onrender.com/api/alertes/confirmation/${_id}/${videur._id}`;

    const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <div style="background-color: #00A551; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0;">
        <h2 style="margin: 0;">Nouveau Signalement de Dépôt Sauvage</h2>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p style="font-size: 16px;">Bonjour <strong>${videur.prenom} ${videur.nom}</strong>,</p>
        <p>Un nouveau dépôt sauvage a été signalé et vous a été assigné pour intervention.</p>
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
          <h3 style="margin-top: 0; color:#00A551;">Détails du signalement</h3>
          <p><strong>📍 Adresse :</strong> ${adresse}</p>
          <p><strong>📝 Description :</strong> ${description || 'Aucune description fournie'}</p>
          <p><strong>🆔 Référence :</strong> ${_id}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${mapsLink}" style="background-color: #00A551; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            🗺️ VOIR L'ITINÉRAIRE SUR GOOGLE MAPS
          </a>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationLink}" style="background-color: #007BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            ✅ Confirmer l'intervention
          </a>
        </div>
        <p>Merci de traiter ce signalement dès que possible et de cliquer sur le lien ci-dessus pour confirmer l'intervention.</p>
        <p style="margin-top: 30px;">Cordialement,<br>L'équipe de gestion SETALDAKAR</p>
      </div>
      <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px;">
        <p style="margin: 5px 0;">Ce message a été envoyé automatiquement, merci de ne pas y répondre.</p>
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} SETALDAKAR - Tous droits réservés</p>
      </div>
    </div>
  `;
  

    const textMessage = `
Nouveau Signalement de Dépôt Sauvage

Bonjour ${videur.prenom} ${videur.nom},

Un nouveau dépôt sauvage a été signalé et vous a été assigné pour intervention.

Détails du signalement:
- Adresse : ${adresse}
- Description : ${description || 'Aucune description fournie'}
- Date du signalement : ${new Date(dateSignalement).toLocaleString('fr-FR')}
- Référence : ${_id}

Pour accéder à l'itinéraire, veuillez copier ce lien dans votre navigateur:
${mapsLink}

Merci de traiter ce signalement dès que possible et de mettre à jour son statut une fois l'intervention terminée.


Pour confirmer l'intervention, veuillez cliquer sur le lien suivant:
${confirmationLink}

Cordialement,
L'équipe de gestion SETALDAKAR

Ce message a été envoyé automatiquement, merci de ne pas y répondre.
© ${new Date().getFullYear()} SETALDAKAR - Tous droits réservés
    `;

   
    const mailOptions = {
      from: `"SETALDAKAR" <${process.env.EMAIL_USER}>`,
      to: videur.email,
      subject: `[URGENT] Nouveau signalement de dépôt sauvage - Ref: ${_id.toString().substring(0, 8)}`,
      text: textMessage,
      html: htmlMessage
    };
    

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email de signalement envoyé: ', info.messageId);
      return info;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw error;
    }
  }
}

module.exports = EmailDeposSauvagesService;

