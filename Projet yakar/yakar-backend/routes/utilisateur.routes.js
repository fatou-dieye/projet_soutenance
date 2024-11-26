// routes/utilisateur.routes.js
const express = require('express');
const router = express.Router();
const UtilisateurController = require('../controllers/utilisateur.controller');

const { 
  verifierToken, 
  verifierAdmin,
  verifierSession
} = require('../middleware/auth');

// Importer toutes les méthodes du contrôleur
const {
  getAllUtilisateurs,
  updateUtilisateur,
  rechercherUtilisateurs,
  getUtilisateurById,
  deleteUtilisateur
} = require('../controllers/utilisateur.controller');

/**
 * Routes de gestion des utilisateurs (admin uniquement)
 */

// Liste complète des utilisateurs
router.get(
  '/liste', 
  [verifierToken, verifierAdmin], 
  getAllUtilisateurs
);

// Recherche d'utilisateurs
router.get(
  '/recherche', 
  [verifierToken, verifierAdmin], 
  rechercherUtilisateurs
);

// Obtenir un utilisateur par ID
router.get(
  '/:id', 
  [verifierToken, verifierAdmin], 
  getUtilisateurById
);

// Mettre à jour un utilisateur
router.put(
  '/:id', 
  [verifierToken, verifierAdmin], 
  updateUtilisateur
);

// Supprimer un utilisateur
router.delete(
  '/:id', 
  [verifierToken, verifierAdmin], 
  deleteUtilisateur
);

// Supprimer plusieurs utilisateurs (admin uniquement)
router.post(
  '/supprimer-multiple',
  [verifierToken, verifierAdmin],
  UtilisateurController.deleteMultipleUtilisateurs
);

module.exports = router;