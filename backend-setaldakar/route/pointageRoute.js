// routes/guardRoutes.js
const express = require('express');

const router = express.Router();

const pointageController = require('../controllers/pointageController');


const { verifyToken, verifyRole,invalidateToken } = require('../middleware/authmiddleware');

// Assigner une carte RFID
router.post('/assign-rfid', verifyToken, pointageController.assignRFID);

// Enregistrer le pointage
router.post('/record-attendance', pointageController.recordAttendance);



// Assigner une carte RFID
router.post('/assign-rfid', verifyToken, verifyRole(['administrateur']), pointageController.assignRFID);

// Enregistrer le pointage
router.post('/record-attendance', pointageController.recordAttendance); 


// Récupérer les enregistrements de pointage
router.get('/attendance-records', verifyToken, verifyRole(['administrateur']), pointageController.getAttendanceRecords);
//voir les pointage journaliers
router.get('/getTodayAttendanceRecords', verifyToken, verifyRole(['administrateur']), pointageController.getTodayAttendanceRecords);

//voir le nombre de pontage dans la journee
router.get('/daily-attendance-count', verifyToken, verifyRole(['administrateur']), pointageController.getDailyAttendanceCount);

module.exports = router;


router.get('/all-gardiens', verifyToken, verifyRole(['administrateur']), pointageController.getAllGardiens);
module.exports = router;

