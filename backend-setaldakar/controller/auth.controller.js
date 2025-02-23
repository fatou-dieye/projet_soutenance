//controller/auth.controller.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Utilisateur = require('../models/utilisateur.model');



// Login
exports.login = async (req, res) => {
    try {
      const { email, telephone, mot_passe } = req.body;
      let utilisateur;
  
      if ((email || telephone) && mot_passe) {
        utilisateur = email 
          ? await Utilisateur.findOne({ email }) 
          : await Utilisateur.findOne({ telephone });
  
        if (!utilisateur) {
          return res.status(404).json({ message: "Utilisateur non trouvé." });
        }
  
        if (utilisateur.statut === 'bloquer') {
          return res.status(403).json({ message: "Compte bloqué." });
        }
  
        if (utilisateur.role === 'videur' || utilisateur.role === 'gardien') {
          return res.status(403).json({ message: "Accès refusé." });
        }
  
        const validPassword = await bcrypt.compare(mot_passe, utilisateur.mot_passe);
        if (!validPassword) {
          return res.status(401).json({ message: "Mot de passe incorrect." });
        }
      } else {
        return res.status(400).json({ message: "Email/téléphone et mot de passe requis." });
      }
  
      const token = jwt.sign(
        { userId: utilisateur._id, email: utilisateur.email, role: utilisateur.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
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
  
    } catch (error) {
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




