//controller/auth.controller.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Utilisateur = require('../models/Utilisateur');


const { enregistrerAction  } = require('../controllers/historiqueController');// Configuration du stockage des images



exports.login = async (req, res) => {
  try {
    const { email, telephone, mot_passe } = req.body;
    let utilisateur;

    // Vérifiez si l'email ou le téléphone et le mot de passe sont fournis
    if ((email || telephone) && mot_passe) {
      // Sélectionner l'utilisateur en fonction de l'email ou du téléphone
      utilisateur = email
        ? await Utilisateur.findOne({ email }).select('+mot_passe') // Ajoutez +mot_passe pour s'assurer que mot_passe est inclus
        : await Utilisateur.findOne({ telephone }).select('+mot_passe');

      // Vérifiez si l'utilisateur existe
      if (!utilisateur) {
        return res.status(404).json({ message: "Utilisateur non trouvé." }); // Réponse immédiate si l'utilisateur est introuvable
      }

      // Vérifiez si le compte est bloqué
      if (utilisateur.statut === 'bloquer') {
        return res.status(403).json({ message: "Compte bloqué." }); // Réponse immédiate si le compte est bloqué
      }

      // Vérifiez le rôle de l'utilisateur
      if (utilisateur.role === 'videur' || utilisateur.role === 'gardien') {
        return res.status(403).json({ message: "Accès refusé." }); // Réponse immédiate si l'accès est refusé
      }

      // Vérifiez le mot de passe
      const validPassword = await bcrypt.compare(mot_passe, utilisateur.mot_passe);
      if (!validPassword) {
        return res.status(401).json({ message: "Mot de passe incorrect." }); // Réponse immédiate si le mot de passe est incorrect
      }
    } else {
      return res.status(400).json({ message: "Email/téléphone et mot de passe requis." }); // Réponse immédiate si l'email/téléphone ou le mot de passe sont manquants
    }

    // Créez le token JWT si l'utilisateur est authentifié avec succès
    const token = jwt.sign(
      { userId: utilisateur._id, email: utilisateur.email, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

            // Enregistrer l'action de connexion dans l'historique avant de répondre
            await enregistrerAction(utilisateur._id, "Connexion réussie", utilisateur._id, "Connexion de l'utilisateur");


    // Répondre avec le token et les détails de l'utilisateur
    return res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: utilisateur._id,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        role: utilisateur.role,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom
      }
    });

  } catch (error) {
    // Gestion des erreurs serveur
    console.error("Erreur lors de la connexion:", error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


  
  // Logout
  exports.logout = async (req, res) => {
    try {
      const userId = req.utilisateur.userId;
      await Utilisateur.findByIdAndUpdate(userId, { derniere_deconnexion: new Date() });
  
      const token = req.headers.authorization.split(' ')[1];
      invalidateToken(token);
  
      res.json({ message: 'Déconnexion réussie', userId });
  
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la déconnexion', error: error.message });
    }
  };