const jwt = require('jsonwebtoken');
const Utilisateur = require('../models/utilisateur.model');

const verifierToken = async (req, res, next) => {
 try {
   const token = req.header('Authorization')?.replace('Bearer ', '');
   
   if (!token) {
     return res.status(401).json({
       success: false,
       message: 'Token non fourni. Authentification requise'
     });
   }

   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   const utilisateur = await Utilisateur.findById(decoded.id)
     .select('-mot_passe -code_secret');

   if (!utilisateur) {
     return res.status(401).json({
       success: false,
       message: 'Utilisateur non trouvé'
     });
   }

   if (!utilisateur.tokenActif) {
     return res.status(401).json({
       success: false,
       message: 'Session invalide. Veuillez vous reconnecter' 
     });
   }

   req.utilisateur = utilisateur;
   next();

 } catch (error) {
   if (error.name === 'TokenExpiredError') {
     return res.status(401).json({
       success: false,
       message: 'Token expiré. Veuillez vous reconnecter'
     });
   }

   if (error.name === 'JsonWebTokenError') {
     return res.status(401).json({
       success: false,
       message: 'Token invalide'
     });
   }

   console.error('Erreur d\'authentification:', error);
   res.status(500).json({
     success: false,
     message: 'Erreur lors de l\'authentification',
     error: error.message
   });
 }
};

const verifierAdmin = (req, res, next) => {
 if (!req.utilisateur) {
   return res.status(401).json({
     success: false,
     message: 'Authentification requise'
   });
 }

 if (req.utilisateur.role !== 'administrateur') {
   return res.status(403).json({
     success: false,
     message: 'Accès refusé. Droits administrateur requis'
   });
 }

 next();
};

const verifierProprietaire = (req, res, next) => {
 if (req.utilisateur.role !== 'administrateur' && 
     req.params.id !== req.utilisateur.id.toString()) {
   return res.status(403).json({
     success: false,
     message: 'Accès refusé. Vous ne pouvez accéder qu\'à vos propres données'
   });
 }

 next();
};

const verifierSession = async (req, res, next) => {
 if (!req.utilisateur || !req.utilisateur.derniereConnexion) {
   return res.status(440).json({
     success: false,
     message: 'Session expirée. Veuillez vous reconnecter'
   });
 }

 const dernierAcces = new Date(req.utilisateur.derniereConnexion);
 const maintenant = new Date();
 const diffHeures = (maintenant - dernierAcces) / (1000 * 60 * 60);

 if (diffHeures > 24) {
   return res.status(440).json({
     success: false, 
     message: 'Session expirée. Veuillez vous reconnecter'
   });
 }

 if (diffHeures > 1) {
   await Utilisateur.findByIdAndUpdate(req.utilisateur.id, {
     derniereConnexion: maintenant
   });
 }

 next();
};

module.exports = {
 verifierToken,
 verifierAdmin,
 verifierProprietaire,
 verifierSession
};