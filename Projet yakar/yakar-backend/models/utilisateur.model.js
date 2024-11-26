const mongoose = require('mongoose');
// Fonction pour générer un matricule unique
const generateMatricule = () => {
  const date = new Date();
  // Générer un matricule unique basé sur l'année, le mois, et un nombre aléatoire
  return `mat-${date.getFullYear()}-${Math.random().toString(36).substr(2, 9).toLowerCase()}`;
};

const schemaUtilisateur = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String,required: true },
  email: { type: String, required: true, unique: true },
  mot_passe: { type: String, required: true },
  code_secret: { type: Number, required: true,unique: true },
  matricule: { type: String, required: false, unique: true, default: generateMatricule },
  role: { type: String, enum: ['administrateur', 'utilisateur'] },
  derniereConnexion:{type: Date } ,
  dateCreation: { type: Date, default: Date.now },
  tokenActif: { type: Boolean, default: false },
  derniereDeconnexion: { type: Date, default: null }
});

module.exports = mongoose.model('Utilisateur', schemaUtilisateur);