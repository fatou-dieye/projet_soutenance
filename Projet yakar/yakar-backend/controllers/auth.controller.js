// controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/utilisateur.model');

class AuthController {
  // Inscription

  static async inscription(req, res) {
    try {
      // Vérifier que l'utilisateur qui fait la requête est un admin
      if (req.utilisateur.role !== 'administrateur') {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Seul un administrateur peut créer de nouveaux utilisateurs'
        });
      }
  
      const { nom, prenom, email, mot_passe, role } = req.body;
  
      // Vérifier si l'utilisateur existe déjà avec cet email
      const utilisateurExistant = await Utilisateur.findOne({ email });
  
      if (utilisateurExistant) {
        return res.status(400).json({
          success: false,
          message: 'Un utilisateur existe déjà avec cet email'
        });
      }
  
      // Générer un code secret unique
      let code_secret;
      let codeUnique = false;
      let tentatives = 0;
      const maxTentatives = 10;
  
      while (!codeUnique && tentatives < maxTentatives) {
        // Générer un code à 4 chiffres (entre 1000 et 9999)
        code_secret = Math.floor(1000 + Math.random() * 9000);
        
        // Vérifier si ce code existe déjà
        const codeExistant = await Utilisateur.findOne({ code_secret });
        if (!codeExistant) {
          codeUnique = true;
        }
        tentatives++;
      }
  
      if (!codeUnique) {
        return res.status(500).json({
          success: false,
          message: 'Impossible de générer un code secret unique. Veuillez réessayer.'
        });
      }
  
      // Hasher le mot de passe
      const salt = await bcrypt.genSalt(10);
      const motPasseHash = await bcrypt.hash(mot_passe, salt);
  
      // Créer le nouvel utilisateur
      const utilisateur = new Utilisateur({
        nom,
        prenom,
        email,
        mot_passe: motPasseHash,
        code_secret,
        role: role || 'utilisateur', // Valeur par défaut si non spécifié
        tokenActif: false,
        derniereConnexion: null
      });
  
      await utilisateur.save();
  
      res.status(201).json({
        success: true,
        message: 'Inscription réussie. L\'utilisateur doit se connecter pour activer son compte.',
        utilisateur: {
          id: utilisateur._id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          code_secret: utilisateur.code_secret, // Inclure le code secret dans la réponse
          role: utilisateur.role
        }
      });
    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'inscription',
        error: error.message
      });
    }
  }

  // Connexion avec email et mot de passe
  static async connexionEmail(req, res) {
    try {
      const { email, mot_passe } = req.body;
  
      // Vérifier si l'utilisateur existe
      const utilisateur = await Utilisateur.findOne({ email });
      if (!utilisateur) {
        return res.status(400).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }
  
      // Vérifier le mot de passe
      const motPasseValide = await bcrypt.compare(mot_passe, utilisateur.mot_passe);
      if (!motPasseValide) {
        return res.status(400).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }
  
      // Mettre à jour le statut de connexion
      utilisateur.derniereConnexion = new Date();
      utilisateur.tokenActif = true;
      utilisateur.derniereDeconnexion = null;
      await utilisateur.save();
  
      // Créer le token JWT avec une expiration plus courte (2 heures)
      const token = jwt.sign(
        { id: utilisateur._id },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }  // Changé à 2 heures au lieu de 24h
      );
      
       res.json({
        success: true,
        message: 'Connexion réussie',
        token,
        utilisateur: {
           id: utilisateur._id,
           nom: utilisateur.nom,
           prenom: utilisateur.prenom,
           email: utilisateur.email,
           role: utilisateur.role
        }
      
      
    });
  
    } catch (error) {
      console.error('Erreur connexion email:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion',
        error: error.message
      });
    }
  }

  // Connexion avec code secret
  static async connexionCode(req, res) {
    try {
      console.log('Body reçu:', req.body);
      const { code_secret } = req.body;
  
      // Log du code reçu
      console.log('Code secret reçu:', code_secret, 'Type:', typeof code_secret);
  
      // Validation de base
      if (!code_secret) {
        return res.status(400).json({
          success: false,
          message: 'Le code secret est requis'
        });
      }
  
      // Convertir en string et nettoyer
      const cleanedCode = code_secret.toString().trim();
      console.log('Code nettoyé:', cleanedCode);
  
      // Vérifier le format
      if (!/^\d{4}$/.test(cleanedCode)) {
        return res.status(400).json({
          success: false,
          message: 'Le code secret doit contenir exactement 4 chiffres'
        });
      }
  
      // Recherche dans la base de données
      console.log('Recherche utilisateur avec code:', cleanedCode);
      
      // D'abord, vérifier tous les utilisateurs
      const allUsers = await Utilisateur.find({}, 'code_secret');
      console.log('Tous les codes secrets en base:', allUsers.map(u => u.code_secret));
  
      // Puis chercher l'utilisateur spécifique
      const utilisateur = await Utilisateur.findOne({ code_secret: cleanedCode });
      console.log('Utilisateur trouvé:', utilisateur ? 'Oui' : 'Non');
      
      if (!utilisateur) {
        return res.status(400).json({
          success: false,
          message: 'Code secret incorrect'
        });
      }
  
      // Mettre à jour le statut de connexion
      utilisateur.derniereConnexion = new Date();
      utilisateur.tokenActif = true;
      utilisateur.derniereDeconnexion = null;
      await utilisateur.save();
  
      // Créer le token JWT
      const token = jwt.sign(
        { 
          id: utilisateur._id,
          role: utilisateur.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
  
      // Envoyer la réponse
      res.json({
        success: true,
        message: 'Connexion réussie',
        token,
        utilisateur: {
          id: utilisateur._id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          role: utilisateur.role
        }
      });
  
    } catch (error) {
      console.error('Erreur complète:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion',
        error: error.message
      });
    }
  }

  // Méthode privée pour finaliser la connexion
  static async finaliserConnexion(utilisateur, res) {
    // Mettre à jour la dernière connexion
    utilisateur.derniereConnexion = new Date();
    await utilisateur.save();

    // Créer le token JWT
    const token = jwt.sign(
      { id: utilisateur._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie, Bienvenue sur le Dashboard',
      token,
      // utilisateur: {
      //   id: utilisateur._id,
      //   nom: utilisateur.nom,
      //   prenom: utilisateur.prenom,
      //   email: utilisateur.email,
      //   role: utilisateur.role
      // }
    });
  }

  // Récupérer le profil
  static async getProfil(req, res) {
    try {
      const utilisateur = await Utilisateur.findById(req.utilisateur.id)
        .select('-mot_passe -code_secret');

      res.json({
        success: true,
        utilisateur
      });
    } catch (error) {
      console.error('Erreur getProfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil',
        error: error.message
      });
    }
  }


// Ajouter la méthode logout
static async logout(req, res) {
  try {
    const utilisateur = await Utilisateur.findById(req.utilisateur.id);
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    utilisateur.derniereConnexion = null;
    utilisateur.derniereDeconnexion = new Date();
    utilisateur.tokenActif = false;
    await utilisateur.save();

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: error.message
    });
  }
}
//changer lee role 
static async changerRole(req, res) {
  try {
    const utilisateur = await Utilisateur.findById(req.params.id);
    
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
 
    // Switch le rôle
    utilisateur.role = utilisateur.role === 'administrateur' ? 'utilisateur' : 'administrateur';
    await utilisateur.save();
 
    res.json({
      success: true,
      message: `Rôle modifié en ${utilisateur.role}`,
      utilisateur: {
        id: utilisateur._id, 
        nom: utilisateur.nom,
        role: utilisateur.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de rôle',
      error: error.message
    });
  }
 }
}

module.exports = AuthController;