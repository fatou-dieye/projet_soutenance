const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  adresse: { type: String, required: true },
  coordonnees: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  niveau: { type: Number, required: true },
  date: { type: Date, required: true },
  heure: { type: String, required: true },
  status: { type: String, default: 'en attente' },
  bac_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin', required: true }
});

module.exports = mongoose.model('Alert', alertSchema);