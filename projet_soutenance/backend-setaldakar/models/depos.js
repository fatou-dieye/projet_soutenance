const mongoose = require('mongoose');

const depotSchema = new mongoose.Schema({
  lieu: { type: String, required: true },
  coordonnees: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  gardien_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('Depot', depotSchema);
