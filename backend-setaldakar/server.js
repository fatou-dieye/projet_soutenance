require('dotenv').config(); // Charger les variables d'environnement
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/database'); // Connexion à la base de données
const userRoutes = require('./route/utilisateurRoute'); // Routes des utilisateurs
const authRoutes = require('./route/utilisateurRoute');
const alerteRoutes = require('./route/signalRoutes');
const pointageRoute = require('./route/pointageRoute');
const alertRoute = require('./route/alertRoute');
const sensorRoutes = require('./route/sensorRoutes');
const signalRoutes = require('./route/signalRoutes');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require('path');
const mongoose = require('mongoose'); // Assurez-vous d'importer Mongoose
// Importez les modèles Mongoose
const Utilisateur = require('./models/Utilisateur');
const { Pointage, Attendance } = require('./models/Pointage');

// Add these imports at the top with your other imports
const Alert = require('./models/Alert');
const Depot = require('./models/depos');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:4200', // Remplacez par l'URL de votre application Angular
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('JWT_SECRET is not defined');
  process.exit(1);
}

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());

connectDB();

// Fonction pour trouver le port Arduino
async function findArduinoPort() {
    const ports = await SerialPort.list();
    const arduinoPort = ports.find(port =>
        port.vendorId && port.productId &&
        (port.path.includes('ACM') || port.path.includes('USB'))
    );
    if (!arduinoPort) {
        throw new Error('Arduino non trouvé. Vérifiez la connexion USB.');
    }
    return arduinoPort.path;
}




// Gestion du scan RFID et pointage
async function setupSerialCommunication() {
  try {
    const portPath = await findArduinoPort();
    if (portPath) {
      console.log('Port série trouvé:', portPath);
      const port = new SerialPort({ path: portPath, baudRate: 9600 });
      const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      parser.on('data', (data) => {
        console.log('Données brutes reçues:', data);
      
        // Traitement des données de carte RFID (JSON)
        if (data.trim().startsWith('{')) {
          try {
            const cardData = JSON.parse(data);
            if (cardData && cardData.cardId) {
              const cardId = cardData.cardId.trim().toLowerCase();
              console.log('Carte RFID scannée:', cardId);
              io.emit('rfid-scanned', { cardId });
              handlePointage(cardId);
            }
          } catch (parseError) {
            console.error('Erreur lors du parsing des données JSON:', parseError);
          }
        } 
        // Traitement des données du capteur de niveau de poubelle
        else if (data.includes('Niveau de remplissage:')) {
          try {
            // Extraction du pourcentage de remplissage
            const match = data.match(/Niveau de remplissage:\s*(\d+)\s*%/);
            if (match && match[1]) {
              const niveauPoubelle = parseInt(match[1]);
              console.log('Niveau de remplissage détecté:', niveauPoubelle, '%');
              
              // Émission de l'événement via websocket
              io.emit('trash-level', { niveauPoubelle });
                 // Vérification du seuil et création d'alerte si nécessaire
      verifierNiveauEtCreerAlerte(niveauPoubelle);
            }
          } catch (error) {
            console.error('Erreur lors du traitement des données de niveau de poubelle:', error);
          }
        } else {
          console.log('Message non reconnu et ignoré:', data);
        }
      });

      port.on('error', (err) => console.error('Erreur série:', err));
    } else {
      console.warn('Arduino non trouvé. Mode simulation activé.');
    }
  } catch (error) {
    console.error('Erreur lors de la configuration de la communication série :', error.message);
  }
}
// Ajoutez cette variable pour suivre quand la dernière alerte a été créée
let derniereAlerteCreeA = null;

// Modifiez cette fonction pour récupérer dynamiquement le dépôt
async function verifierNiveauEtCreerAlerte(niveauPoubelle) {
  if (niveauPoubelle > 80) {
    const maintenant = new Date();
    // Créer une nouvelle alerte seulement si ça fait plus de 15 minutes depuis la dernière
    if (!derniereAlerteCreeA || (maintenant - derniereAlerteCreeA) > 5 * 60 * 1000) {
      try {
        // Récupérer le premier dépôt disponible dans la base de données
        const depot = await Depot.findOne().sort({ _id: 1 });
        
        if (!depot) {
          console.error("Aucun dépôt trouvé dans la base de données");
          return;
        }
        
        const alert = new Alert({
          depot_id: depot._id, // Utiliser l'ID du dépôt récupéré
          niveau: niveauPoubelle,
          date: new Date(),
          heure: new Date().toLocaleTimeString()
        });
        
        await alert.save();
        console.log(`Alerte créée automatiquement - Niveau: ${niveauPoubelle}%, Dépôt: ${depot._id}`);
        derniereAlerteCreeA = maintenant;
        
        // Émettre un événement pour informer les clients de la nouvelle alerte
        io.emit('new-alert', { 
          message: 'Nouveau niveau d\'alerte détecté', 
          niveau: niveauPoubelle,
          depot: depot._id 
        });
      } catch (error) {
        console.error("Erreur lors de la création automatique d'alerte:", error);
      }
    }
  }
}
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

// Fonction pour gérer le pointage
async function handlePointage(cardId) {
  try {
    // Chercher la carte RFID dans la base de données
    const pointage = await Pointage.findOne({ carte_rfid: cardId });

    if (!pointage) {
      console.log(`Erreur: Carte RFID ${cardId} non trouvée dans la base de données.`);
      io.emit('rfid-status', { message: `Erreur: Carte RFID ${cardId} non trouvée dans la base de données.`, data: {} });
      return;
    }

    // Vérification de l'état de la carte
    if (pointage.carte_etat === 'bloqué') {
      console.log('❌ Carte bloquée, pointage impossible.');
      io.emit('rfid-status', { message: 'Carte bloquée, pointage impossible.', data: {} });
      return;
    }

    const guard_id = pointage.guard_id;
    const location = pointage.location;

    // Trouver l'utilisateur associé au `guard_id`
    const utilisateur = await Utilisateur.findById(guard_id);
    if (!utilisateur) {
      console.log('Erreur: Gardien non trouvé dans la base de données.');
      io.emit('rfid-status', { message: 'Erreur: Gardien non trouvé dans la base de données.', data: {} });
      return;
    }

    const name = `${utilisateur.prenom} ${utilisateur.nom}`;
    console.log('Nom du gardien:', name);

    const now = new Date();
    const date = now.toISOString().split('T')[0];  // Format de la date: yyyy-mm-dd
    const checkInTime = now.toISOString().substr(11, 8);  // Heure: hh:mm:ss

    // Vérifier si un pointage existe déjà pour ce jour
    let attendance = await Attendance.findOne({ guard_id: guard_id, date });

    if (attendance) {
      // Si un pointage existe, mettre à jour l'heure de sortie
      attendance.check_out_time = now.toISOString();  // Mettre à jour l'heure de sortie
      attendance.location = location;
      attendance.name = name;
      await attendance.save();
      console.log('Pointage mis à jour:', attendance);
    } else {
      // Sinon, créer un nouveau pointage
      attendance = new Attendance({
        guard_id,
        name,
        date,
        check_in_time: checkInTime,
        check_out_time: null,  // Heure de sortie est null lors de l'entrée
        location,
        status: determineStatus(checkInTime)
      });

      await attendance.save();
      console.log('Nouveau pointage créé:', attendance);
    }

    // Répondre au client avec le résultat du pointage
    io.emit('rfid-status', {
      message: `Pointage enregistré avec succès pour ${name}`,
      data: attendance
    });

  } catch (error) {
    console.error('Erreur lors du traitement des données:', error);
    io.emit('rfid-status', { message: 'Erreur lors du traitement des données.', data: {} });
  }
}

// Appeler la fonction pour démarrer la gestion du scan RFID
setupSerialCommunication();






// Utilisation des routes
app.use('/api', userRoutes); // Prefixe les routes par /api
app.use('/api/auth', authRoutes);
app.use('/api', pointageRoute);
app.use('/api', signalRoutes);
app.use('/api', alertRoute)
// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Assurez-vous que la connexion socket et l'événement sont bien captés
io.on('connection', (socket) => {
  console.log('Un client est connecté');

  // Lorsque le serveur reçoit une carte RFID scannée, il émet l'événement à tous les clients
  socket.on('rfid-scanned', (data) => {
    console.log('Carte RFID scannée:', data);
    io.emit('rfid-scanned', { cardId: data.cardId });  // L'envoi à tous les clients
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});