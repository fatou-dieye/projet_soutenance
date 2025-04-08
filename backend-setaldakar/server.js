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

// Initialiser le SensorService avec l'instance io
const SensorService = require('./services/sensorService')(io);

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
        console.log('Données brutes reçues:', data); // Affichage des données brutes reçues

        // Fonction asynchrone pour traiter les données
        const processCardData = async () => {
          try {
            if (data.trim().startsWith('{')) {
              const cardData = JSON.parse(data);
              if (cardData && cardData.cardId) {
                const cardId = cardData.cardId.trim().toLowerCase();
                console.log('Carte RFID scannée:', cardId);

                // Emit pour le client WebSocket
                io.emit('rfid-scanned', { cardId });

                // Appel du pointage avec l'ID de la carte scannée
                await handlePointage(cardId);
              } else {
                console.error('Format de données JSON inattendu:', data);
              }
            } else {
              console.log('Message non-JSON reçu et ignoré:', data);
            }
          } catch (parseError) {
            console.error('Erreur lors du parsing des données JSON:', parseError);
          }
        };

        // Appel de la fonction asynchrone
        processCardData();
      });

      port.on('error', (err) => console.error('Erreur série:', err));
    } else {
      console.warn('Arduino non trouvé. Mode simulation activé.');
    }
  } catch (error) {
    console.error('Erreur lors de la configuration de la communication série :', error.message);
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
app.use('/api', alertRoute);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', sensorRoutes);

// Configuration Socket.IO
io.on('connection', (socket) => {
  console.log('Client connecté au socket');

  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });

  socket.on('rfid-scanned', (data) => {
    console.log('Carte RFID scannée:', data);
    io.emit('rfid-scanned', { cardId: data.cardId });  // L'envoi à tous les clients
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
