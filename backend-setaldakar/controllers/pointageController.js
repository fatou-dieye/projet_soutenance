// controllers/pointageController.js
const { Pointage, Attendance } = require('../models/Pointage');

// Assigner une carte RFID à un gardien
exports.assignRFID = async (req, res) => {
  try {
    const { rfid_id, guard_id, name } = req.body;

    // Vérifier si la carte RFID est déjà assignée
    const existingGuardByRFID = await Pointage.findOne({ rfid_id });
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
      { rfid_id, name, assigned_at: Date.now() },
      { new: true, upsert: true }
    );

    if (!pointage) {
      return res.status(404).json({ error: 'Gardien non trouvé.' });
    }

    res.status(200).json(pointage);
  } catch (error) {
    console.error('Erreur lors de l\'assignation de la carte RFID:', error);
    res.status(500).json({ error: 'Erreur lors de l\'assignation de la carte RFID', details: error.message });
  }
};



// Enregistrer le pointage d'un gardien
exports.recordAttendance = async (req, res) => {
  try {
    const { guard_id, name, date, check_in_time, check_out_time, location } = req.body;
    const attendance = new Attendance({
      guard_id,
      name,
      date,
      check_in_time,
      check_out_time,
      location
    });
    await attendance.save();
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du pointage' });
  }
};

// Récupérer les enregistrements de pointage
exports.getAttendanceRecords = async (req, res) => {
  try {
    const records = await Attendance.find();
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des enregistrements de pointage' });
  }
};
