// routes/guardRoutes.js
const express = require('express');

const router = express.Router();
const pointageController = require('../controllers/pointageController');
const { verifyToken, verifyRole,invalidateToken } = require('../middleware/authmiddleware');

// Assigner une carte RFID
router.post('/assign-rfid', verifyToken, verifyRole(['administrateur']), pointageController.assignRFID);

// Enregistrer le pointage
router.post('/record-attendance', pointageController.recordAttendance); 

// Récupérer les enregistrements de pointage
router.get('/attendance-records', verifyToken, verifyRole(['administrateur']), pointageController.getAttendanceRecords);
//voir les pointage journaliers
router.get('/getTodayAttendanceRecords', verifyToken, verifyRole(['administrateur']), pointageController.getTodayAttendanceRecords);
router.get('/attendance-by-date',verifyToken, verifyRole(['administrateur']), pointageController.getAttendanceByDate);


router.get('/all-gardiens', verifyToken, verifyRole(['administrateur']), pointageController.getAllGardiens);

router.post('/block-rfid',verifyToken, verifyRole(['administrateur']), pointageController.blockRFID);
router.post('/unblock-rfid',verifyToken, verifyRole(['administrateur']), pointageController.unblockRFID);

module.exports = router;