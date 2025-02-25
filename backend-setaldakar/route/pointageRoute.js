// routes/guardRoutes.js
const express = require('express');
const router = express.Router();
const pointageController = require('../controllers/pointageController');

// Assigner une carte RFID
router.post('/assign-rfid', pointageController.assignRFID);

// Enregistrer le pointage
router.post('/record-attendance', pointageController.recordAttendance);

// Récupérer les enregistrements de pointage
router.get('/attendance-records', pointageController.getAttendanceRecords);

module.exports = router;
