// controllers/pointageController.js


const Utilisateur = require('../models/Utilisateur');
const { Pointage } = require('../models/Pointage');
const mongoose = require('mongoose');
const { Attendance } = require('../models/Pointage'); // Utiliser destructuring pour importer Attendance
const moment = require('moment');





// Assigner une carte RFID à un gardien
exports.assignRFID = async (req, res) => {
  try {
    const { carte_rfid, guard_id, name } = req.body;

    // Vérifier si la carte RFID est déjà assignée
    const existingGuardByRFID = await Pointage.findOne({ carte_rfid});
    if (existingGuardByRFID) {
      return res.status(400).json({ error: 'Cette carte RFID est déjà assignée à un autre gardien.' });
    }

    // Vérifier si le gardien est déjà assigné à une autre carte RFID
    const existingGuardByID = await Pointage.findOne({ guard_id });
    if (existingGuardByID && existingGuardByID.rfid_id) {
      return res.status(400).json({ error: 'Ce gardien est déjà assigné à une autre carte RFID.' });
    }

    // Assigner la carte RFID au gardien
    const pointage = await Pointage.findOneAndUpdate(
      { guard_id },
      { carte_rfid, assigned_at: Date.now() },
      { new: true, upsert: true }
    );

    if (!pointage) {
      return res.status(404).json({ error: 'Gardien non trouvé.' });
    }

    // Mettre à jour l'utilisateur avec le rfid_id
    await Utilisateur.findByIdAndUpdate(guard_id, { carte_rfid });

    res.status(200).json(pointage);
  } catch (error) {
    console.error('Erreur lors de l\'assignation de la carte RFID:', error);
    res.status(500).json({ error: 'Erreur lors de l\'assignation de la carte RFID', details: error.message });
  }
};






// Enregistrer le pointage d'un gardien
exports.recordAttendance = async (req, res) => {
  try {
    const { guard_id, name, date, location } = req.body;

    // Convertir guard_id en ObjectId si ce n'est pas déjà un ObjectId
    const guardObjectId = new mongoose.Types.ObjectId(guard_id); // Utilisation de 'new'

    // Vérification si la date est valide
    if (!isValidDate(date)) {
      return res.status(400).json({ error: 'Date de pointage invalide' });
    }

    // Obtenir l'heure actuelle
    const currentTime = new Date();
    const formattedCurrentTime = formatTime(currentTime);

    // Vérifier si un enregistrement existe déjà pour le gardien à la date donnée
    let attendance = await Attendance.findOne({ guard_id: guardObjectId, date });

    if (attendance) {
      // Si un enregistrement existe, mettre à jour le check_out_time
      attendance.check_out_time = formattedCurrentTime;
      attendance.location = location; // Mettre à jour la localisation si nécessaire
      await attendance.save();
    } else {
      // Sinon, créer un nouvel enregistrement avec check_out_time à null
      attendance = new Attendance({
        guard_id: guardObjectId,
        name,
        date,
        check_in_time: formattedCurrentTime,
        check_out_time: null, // Initialiser check_out_time à null
        location
      });
      await attendance.save();
    }

    // Répondre avec l'objet créé ou mis à jour
    res.status(200).json(attendance);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du pointage:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du pointage', details: error.message });
  }
};

// Fonction de validation de date
function isValidDate(date) {
  return !isNaN(Date.parse(date));
}

// Fonction de formatage de l'heure
function formatTime(time) {
  if (time instanceof Date) {
    return time.toISOString().substr(11, 8); // Retourne "HH:mm:ss"
  }
  const date = new Date(`1970-01-01T${time}Z`);
  return date.toISOString().substr(11, 8); // Retourne "HH:mm:ss"
}






// Récupérer les enregistrements de pointage
exports.getAttendanceRecords = async (req, res) => {
  try {
    const records = await Attendance.find();
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des enregistrements de pointage' });
  }
};


// Récupérer les enregistrements de pointage du jour
exports.getTodayAttendanceRecords = async (req, res) => {
  try {
    // Obtenir la date actuelle
    const today = moment().startOf('day');

    // Filtrer les enregistrements de pointage pour aujourd'hui
    const records = await Attendance.find({
      date: {
        $gte: today.toDate(),
        $lt: moment(today).add(1, 'days').toDate()
      }
    });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des enregistrements de pointage du jour' });
  }
};