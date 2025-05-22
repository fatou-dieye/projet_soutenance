// controllers/pointageController.js


const Utilisateur = require('../models/Utilisateur');
const { Pointage } = require('../models/Pointage');
const mongoose = require('mongoose');
const { Attendance } = require('../models/Pointage'); // Utiliser destructuring pour importer Attendance
const moment = require('moment');


const Depot = require('../models/depos'); // Assure-toi que ce chemin est correct


// Assigner une carte RFID
exports.assignRFID = async (req, res) => {
  try {
    const { carte_rfid, guard_id } = req.body;

    // Vérifier si la carte RFID est déjà assignée à un autre gardien
    const existingGuardByRFID = await Pointage.findOne({ carte_rfid });
    if (existingGuardByRFID) {
      return res.status(400).json({ error: 'Cette carte RFID est déjà assignée à un autre gardien.' });
    }

    // Vérifier si le gardien est déjà assigné à une carte RFID
    const existingGuardByID = await Pointage.findOne({ guard_id });
    if (existingGuardByID && existingGuardByID.carte_rfid) {
      return res.status(400).json({ error: 'Ce gardien est déjà assigné à une autre carte RFID.' });
    }

    // Assigner la carte RFID au gardien
    const pointage = await Pointage.findOneAndUpdate(
      { guard_id },
      { carte_rfid, carte_etat: 'active', assigned_at: Date.now() }, // carte_etat devient active
      { new: true, upsert: true }
    );

    if (!pointage) {
      return res.status(404).json({ error: 'Gardien non trouvé.' });
    }

    // Mettre à jour l'utilisateur avec la carte RFID
    await Utilisateur.findByIdAndUpdate(guard_id, { carte_rfid });

    res.status(200).json(pointage);
  } catch (error) {
    console.error('Erreur lors de l\'assignation de la carte RFID:', error);
    res.status(500).json({ error: 'Erreur lors de l\'assignation de la carte RFID', details: error.message });
  }
};

// Bloquer une carte RFID
exports.blockRFID = async (req, res) => {
  try {
    const { guard_id } = req.body;

    // Trouver et mettre à jour le statut de la carte RFID
    const pointage = await Pointage.findOneAndUpdate(
      { guard_id },
      { carte_etat: 'bloqué' }, // Changer le statut en 'bloqué'
      { new: true }
    );


    if (!pointage) {
      return res.status(404).json({ error: 'Gardien non trouvé.' });
    }

        // Sauvegarder le pointage mis à jour
        await pointage.save();

        // Mettre à jour également le champ carte_etat dans l'utilisateur
        await Utilisateur.findByIdAndUpdate(guard_id, { carte_etat: 'bloqué' });
    

    res.status(200).json({ message: 'Carte RFID bloquée avec succès.' });
  } catch (error) {
    console.error('Erreur lors du blocage de la carte RFID:', error);
    res.status(500).json({ error: 'Erreur lors du blocage de la carte RFID', details: error.message });
  }
};

// Débloquer une carte RFID
exports.unblockRFID = async (req, res) => {
  try {
    const { guard_id } = req.body;

    // Trouver et mettre à jour le statut de la carte RFID
    const pointage = await Pointage.findOneAndUpdate(
      { guard_id },
      { carte_etat: 'active' }, // Changer le statut en 'active'
      { new: true }
    );


    if (!pointage) {
      return res.status(404).json({ error: 'Gardien non trouvé.' });
    }

       // Sauvegarder le pointage mis à jour
       await pointage.save();

       // Mettre à jour également le champ carte_etat dans l'utilisateur
       await Utilisateur.findByIdAndUpdate(guard_id, { carte_etat: 'active' });
   

    res.status(200).json({ message: 'Carte RFID débloquée avec succès.' });
  } catch (error) {
    console.error('Erreur lors du déblocage de la carte RFID:', error);
    res.status(500).json({ error: 'Erreur lors du déblocage de la carte RFID', details: error.message });
  }
};





// Fonction pour déterminer le statut en fonction de l'heure de pointage
function determineStatus(checkInTime) {
  const checkInStartLimit = '07:00:00';
  const checkInEndLimit = '08:00:00';

  const checkInDate = new Date(`1970-01-01T${checkInTime}Z`);
  const startLimitDate = new Date(`1970-01-01T${checkInStartLimit}Z`);
  const endLimitDate = new Date(`1970-01-01T${checkInEndLimit}Z`);

  // Comparer les heures
  if (checkInDate >= startLimitDate && checkInDate <= endLimitDate) {
    return 'présent'; // Le gardien est arrivé entre 7h00 et 8h00
  } else if (checkInDate > endLimitDate) {
    return 'retard'; // Le gardien est en retard (après 8h00)
  }
  return 'retard'; // Par défaut, considérer comme retard si l'heure est avant 7h00
}

// Enregistrer le pointage via RFID
exports.recordAttendance = async (req, res) => {
  try {
    const { carte_rfid } = req.body;
    console.log('Données reçues du scanner:', carte_rfid);

    if (!carte_rfid) {
      return res.status(400).json({ error: 'Le champ carte_rfid est requis.' });
    }

    const formattedCardId = carte_rfid.trim().toLowerCase();
    console.log('Carte RFID formatée:', formattedCardId);

    // Rechercher le pointage pour cette carte RFID
    const pointage = await Pointage.findOne({ carte_rfid: formattedCardId });
    if (!pointage) {
      return res.status(400).json({ error: `Carte RFID ${formattedCardId} non assignée à ce gardien.` });
    }

    console.log('Pointage trouvé:', pointage);

    // Vérification de l'état de la carte
    if (pointage.carte_etat === 'bloqué') {
      console.log('Carte bloquée, pointage impossible.');
      return res.status(400).json({ error: 'Carte RFID bloquée, pointage impossible.' });
    }

    const guard_id = pointage.guard_id;
    const now = new Date();
    const date = now.toISOString().split('T')[0];  // Format "YYYY-MM-DD"
    const checkInTime = now.toISOString().substr(11, 8);  // Format "HH:mm:ss"

    const guardObjectId = new mongoose.Types.ObjectId(guard_id);

    // Trouver l'utilisateur associé au gardien
    const utilisateur = await Utilisateur.findById(guardObjectId);
    if (!utilisateur) {
      return res.status(404).json({ error: 'Gardien non trouvé.' });
    }

    const name = `${utilisateur.prenom} ${utilisateur.nom}`;
    const status = determineStatus(checkInTime);  // Calculer le statut (présent/retard)

    // 🔥 Récupération du dépôt associé au gardien
    const depot = await Depot.findOne({ gardien_id: guardObjectId });

    let location = "Non spécifié"; // Valeur par défaut
    if (depot) {
      location = depot.lieu;
      console.log(`Dépôt trouvé : ${location}`);
    } else {
      console.log("Aucun dépôt trouvé pour ce gardien.");
    }

    // Vérifier si un pointage existe déjà pour ce gardien à cette date
    let attendance = await Attendance.findOne({ guard_id: guardObjectId, date });
    console.log('Enregistrement de présence trouvé:', attendance);

    if (attendance) {
      // Si un pointage existe déjà, mettre à jour le check-out_time
      attendance.check_out_time = now.toISOString();
      attendance.location = location;
      attendance.name = name;
      await attendance.save();
      console.log('Pointage mis à jour:', attendance);
    } else {
      // Sinon, créer un nouveau pointage
      attendance = new Attendance({
        guard_id: guardObjectId,
        name,
        date,
        check_in_time: checkInTime,
        check_out_time: null,
        location,
        status
      });

      await attendance.save();
      console.log('Nouveau pointage créé:', attendance);
    }

    res.status(200).json({
      message: `Pointage enregistré avec succès pour le gardien ${name} !`,
      attendance: attendance
    });
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

    // Trier les enregistrements par date (du plus récent au plus ancien)
    records.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des enregistrements de pointage' });
  }
};

// Récupérer les enregistrements de pointage du jour et leur nombre
exports.getTodayAttendanceRecords = async (req, res) => {
  try {
    // Obtenir la date actuelle en UTC
    const today = moment.utc().startOf('day');  // Début de la journée en UTC
    console.log("Date UTC utilisée pour la recherche : ", today.toDate()); // Log pour vérifier

    // Filtrer les enregistrements de pointage pour aujourd'hui en UTC
    const records = await Attendance.find({
      date: {
        $gte: today.toDate(),  // Début de la journée en UTC
        $lt: moment.utc(today).add(1, 'days').toDate()  // Le jour suivant en UTC
      }
    });

    // Calculer le nombre de pointages
    const totalRecords = records.length;

    // Répondre avec les enregistrements récupérés et leur nombre
    res.status(200).json({
      totalRecords,
      records
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la récupération des enregistrements de pointage du jour',
      details: error.message
    });
  }
};

exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();

    const records = await Attendance.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    const totalRecords = records.length;

    res.status(200).json({
      totalRecords,
      records
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la récupération des enregistrements de pointage',
      details: error.message
    });
  }
};




// Récupérer tous les gardiens
exports.getAllGardiens = async (req, res) => {
  try {
    const gardiens = await Utilisateur.find({ role: 'gardient' });
    res.status(200).json(gardiens);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des gardiens' });
  }
};