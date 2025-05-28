// models/Pointage.js
const mongoose = require('mongoose');

const guardSchema = new mongoose.Schema({
  guard_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  carte_rfid: { type: String, unique: true, sparse: true },
  carte_etat: { type: String, enum: ['active', 'bloqué'], default: 'active' }, // Valeur par défaut "active"
  assigned_at: { type: Date, default: Date.now },
});

const attendanceSchema = new mongoose.Schema({
  guard_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  name: { type: String, },
  date: { type: Date },
  check_in_time: { type: String, required: true }, // Format: "HH:mm:ss"
  check_out_time: { type: String }, // Format: "HH:mm:ss"
  location: { type: String, default: 'Non spécifié' },
  status: { type: String, enum: ['présent', 'retard'], required: true },  // Valeurs possibles pour le statut
  carte_etat: { type: String, required: false, enum: ['active', 'bloqué'], default: 'active' }, // Changement du nom de "statut" en "carte_etat"
});


const Pointage = mongoose.model('pointage', guardSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = { Pointage, Attendance };