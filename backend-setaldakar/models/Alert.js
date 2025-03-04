const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  depot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Depot', required: true },
  niveau: { type: Number, required: true },
  date: { type: Date, required: true },
  heure: { type: String, required: true },
  status: { type: String, default: 'en attente' }
});

module.exports = mongoose.model('Alert', alertSchema);
