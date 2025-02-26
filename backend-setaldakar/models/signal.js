//models/alert
const mongoose = require('mongoose');

const alerteSchema = new mongoose.Schema({
  // Informations de base
  titre: {
    type: String,
    required: false,
    trim: true
  },
 description: {
    type: String,
    required: true
  },
  
  // Localisation
  adresse: {
    type: String,
    required: false
  },
  coordonnees: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  
  // Photos
  photos: [{
    chemin: String,
    dateAjout: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Informations sur l'état de l'alerte
  statut: {
    type: String,
    enum: ['Non traité', 'En cours', 'Traité', 'Annulé'],
    default: 'Non traité'
  },
  priorite: {
    type: String,
    enum: ['Basse', 'Moyenne', 'Haute'],
    default: 'Moyenne'
  },
  
  // Relations avec les utilisateurs
  declarant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  chauffeurAssigne: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  
  // Horodatage
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateAssignation: Date,
  dateTraitement: Date,
  
  // Commentaires et suivi
  commentaires: [{
    auteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Utilisateur'
    },
    texte: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// Indexation pour améliorer les performances des requêtes géographiques
alerteSchema.index({ 'coordonnees.latitude': 1, 'coordonnees.longitude': 1 });
alerteSchema.index({ statut: 1 });
alerteSchema.index({ declarant: 1 });
alerteSchema.index({ chauffeurAssigne: 1 });

const Alerte = mongoose.model('Alerte', alerteSchema);

module.exports = Alerte;