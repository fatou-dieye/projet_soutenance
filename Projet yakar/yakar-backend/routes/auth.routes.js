
// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { verifierToken, verifierAdmin } = require('../middleware/auth');

// Routes publiques
router.post('/inscription', [verifierToken, verifierAdmin], AuthController.inscription);
router.post('/connexion/email', AuthController.connexionEmail);
router.post('/connexion/code', AuthController.connexionCode);

// Routes protégées
router.get('/profil', verifierToken, AuthController.getProfil);
router.post('/logout', verifierToken, AuthController.logout);
router.patch('/users/:id/role', verifierToken, verifierAdmin, AuthController.changerRole);
module.exports = router;