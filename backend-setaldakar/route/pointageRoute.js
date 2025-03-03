// routes/guardRoutes.js
const express = require('express');
const router = express.Router();
const pointageController = require('../controllers/pointageController');
const { verifyToken, verifyRole,invalidateToken } = require('../middlware/auth.middleware');

// Assigner une carte RFID
router.post('/assign-rfid', verifyToken, pointageController.assignRFID);

// Enregistrer le pointage
router.post('/record-attendance', pointageController.recordAttendance);

// Récupérer les enregistrements de pointage
router.get('/attendance-records', verifyToken, verifyRole(['administrateur']), pointageController.getAttendanceRecords);
//voir les pointage journaliers
router.get('/getTodayAttendanceRecords', verifyToken, verifyRole(['administrateur']), pointageController.getTodayAttendanceRecords);
module.exports = router;
