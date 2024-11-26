// models/mesure.model.js
const mongoose = require('mongoose');

const schemaMesure = new mongoose.Schema({
  temperature: {
    type: Number,
    required: true
  },
  humidite: {
    type: Number,
    required: true
  },
  horodatage: {
    type: Date,
    required: true,
    default: Date.now
  },
  heurePrevue: {
    type: String,
    enum: ['10:00', '14:00', '17:00']
  },
  etatVentilateur: {
    type: Boolean,
    default: false
  },
  alerteTemperature: {
    type: Boolean,
    default: false
  }
});

// Vérification automatique du dépassement de température
schemaMesure.pre('save', function(next) {
  if (this.temperature > 27) {
    this.alerteTemperature = true;
  }
  next();
});

module.exports = mongoose.model('Mesure', schemaMesure);