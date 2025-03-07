const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Fonction pour générer un matricule unique
const generateMatricule = () => {
  const date = new Date();
  return `MAT-${date.getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
};

// Fonction pour générer un ID RFID unique
const generateRFID = () => {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Définir le schéma de l'utilisateur
const utilisateurSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: false, unique: true },
  mot_passe: { type: String, required: true, select: false },
  matricule: { type: String, required: false, unique: true, default: generateMatricule },
  photo: { type: String, required: false }, // URL ou chemin de l'image
  adresse: { type: String, required: false },
  telephone: { type: String, required: false, unique: true },
  role: { type: String, required: true, enum: ['administrateur', 'utilisateur', 'videur', 'gardient'] },
  statut: { type: String, required: false, enum: ['active', 'bloquer'] },
  carte_rfid: { type: String, unique: true, sparse: true, default: null }, // rfid_id reste null jusqu'à l'assignation
  }, {
  timestamps: true // Ajoute des champs createdAt et updatedAt
});
+9-


// Hacher le mot de passe avant de sauvegarder
utilisateurSchema.pre('save', async function (next) {
  if (!this.isModified('mot_passe')) return next();
  this.mot_passe = await bcrypt.hash(this.mot_passe, 10);
  next();
});

// Créer le modèle utilisateur à partir du schéma
const Utilisateur = mongoose.model('Utilisateur', utilisateurSchema);

// Exporter le modèle
module.exports = Utilisateur;








