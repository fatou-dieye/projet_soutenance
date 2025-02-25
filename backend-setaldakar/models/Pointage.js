// models/Pointage.js
const mongoose = require('mongoose');

const guardSchema = new mongoose.Schema({
  guard_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  name: { type: String, required: true },
  carte_rfid: { type: String, unique: true, sparse: true },
  assigned_at: { type: Date, default: Date.now },
});

const attendanceSchema = new mongoose.Schema({
  guard_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  check_in_time: { type: Date, required: true },
  check_out_time: { type: Date },
  location: { type: String },
});

const Pointage = mongoose.model('pointage', guardSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = { Pointage, Attendance };
