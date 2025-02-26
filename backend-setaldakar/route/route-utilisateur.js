//route-utilisateur
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Utilisateur = require('../models/Utilisateur');
const { verifyToken, verifyRole,invalidateToken } = require('../middlware/auth.middleware');
const authController = require('../controllers/authController');
const utilisateurController = require('../controllers/utilisateurController');
const HistoriqueAction = require('../models/HistoriqueAction');
const historiqueController = require('../controllers/historiqueContrller');  // Assurez-vous de bien l'importer
const motspassoublierController = require('../controllers/motspassoublierController');

// Login avec email/mot de passe ou téléphone/mot de passe

router.post('/login', authController.login);
//route pour deconexion 
router.post('/logout', verifyToken, authController.logout);

// Inscription avec upload de photo
router.post('/register', utilisateurController.upload.single('photo'), utilisateurController.register);


// Lister tous les utilisateurs (admin uniquement)
router.get('/users', verifyToken, verifyRole(['administrateur']), utilisateurController.getAllUsers);

// Récupérer un utilisateur par ID
router.get('/users/:id', verifyToken, utilisateurController.getUserById);

// Mettre à jour le statut de plusieurs utilisateurs
router.put('/users/bulk-update-status', verifyToken, verifyRole(['administrateur']), utilisateurController.updateUsersStatus);

// Modifier un utilisateur (avec upload de photo)
router.put('/users/:id', verifyToken, utilisateurController.upload.single('photo'), utilisateurController.updateUser);

//modifier mots de passe en mettant l'ancien d'abord

// Route pour changer le mot de passe
router.put('/change-password', verifyToken, utilisateurController.changePassword);

// Route pour obtenir les statistiques des utilisateurs par rôle
router.get('/statistiques-utilisateurs', verifyToken, utilisateurController.getUserStatistics);

// Route pour supprimer plusieurs utilisateurs
router.delete('/users/bulk-delete', verifyToken, verifyRole(['administrateur']), utilisateurController.bulkDeleteUsers);

// Route pour supprimer un utilisateur
router.delete('/users/:id', verifyToken, verifyRole(['administrateur']), utilisateurController.deleteUser);
//route pour lister les historique
router.get('/historique', verifyToken, utilisateurController.getHistorique);  // Modification pour utiliser historiqueController


// Route pour bloquer/débloquer un utilisateur par ID
router.put('/users/:id/toggle-status', verifyToken, verifyRole(['administrateur']), utilisateurController.toggleUserStatus);

// Route pour mot de passe oublié
router.post('/forgot-password', motspassoublierController.forgotPassword);



module.exports = router;

