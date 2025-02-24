//controller/auth.controller.js
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/utilisateur.model');
const { logAction } = require('./historiqueController');
const bcrypt = require('bcrypt');



exports.login = async (req, res) => {
  try {
      const { email, telephone, mot_passe } = req.body;
      let utilisateur;

      console.log('Email/Téléphone:', email || telephone);
      const trimmedPassword = mot_passe.trim();
      console.log('Mot de passe fourni (après trim) :', trimmedPassword);

      // Vérification de la présence du mot de passe et de l'email/téléphone
      if ((email || telephone) && mot_passe) {
          // Recherche de l'utilisateur avec l'email ou le téléphone
          utilisateur = email
              ? await Utilisateur.findOne({ email }).select('+mot_passe')
              : await Utilisateur.findOne({ telephone }).select('+mot_passe');

          // Si l'utilisateur n'est pas trouvé
          if (!utilisateur) {
              console.log('Utilisateur non trouvé.');
              return res.status(404).json({ message: "Utilisateur non trouvé." });
          }

          console.log('Utilisateur trouvé:', utilisateur);
          console.log('Mot de passe haché stocké:', utilisateur.mot_passe);

          // Vérification de l'état du compte
          if (utilisateur.statut === 'bloquer') {
              return res.status(403).json({ message: "Compte bloqué." });
          }

          // Vérification du rôle (Accès refusé pour certains rôles)
          if (utilisateur.role === 'videur' || utilisateur.role === 'gardien') {
              return res.status(403).json({ message: "Accès refusé." });
          }

          // Comparaison du mot de passe fourni avec celui stocké
          const validPassword = await bcrypt.compare(trimmedPassword, utilisateur.mot_passe);
          console.log('Mot de passe valide après comparaison:', validPassword);

          // Si le mot de passe est incorrect
          if (!validPassword) {
              console.log('Mot de passe incorrect.');
              return res.status(401).json({ message: "Mot de passe incorrect. Réessayez." });
          }
      } else {
          return res.status(400).json({ message: "Email/téléphone et mot de passe requis." });
      }

      // Création du token JWT
      const token = jwt.sign(
          { userId: utilisateur._id, email: utilisateur.email, role: utilisateur.role },
          process.env.JWT_SECRET, // Assurez-vous que cette variable d'environnement est définie
          { expiresIn: '1h' } // Le token expire après 1 heure
      );

      // Réponse avec le token et les informations de l'utilisateur
      res.json({
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

      // Enregistrement de l'action dans l'historique
      await logAction(utilisateur._id, "Connexion réussie");

  } catch (error) {
      console.error('Erreur lors de la connexion :', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
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