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


// Gestion du scan RFID
async function setupSerialCommunication() {
  try {
    const portPath = await findArduinoPort();
    if (portPath) {
      console.log('Port série trouvé:', portPath);
      const port = new SerialPort({ path: portPath, baudRate: 9600 });
      const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      parser.on('data', (cardId) => {
        console.log('Carte RFID scannée:', cardId);
        io.emit('rfid-scanned', { cardId });
      });

      port.on('error', (err) => console.error('Erreur série:', err));
    } else {
      console.warn('Arduino non trouvé. Mode simulation activé.');
      // Activer le mode simulation ou utiliser des valeurs par défaut
    }
  } catch (error) {
    console.error('Erreur lors de la configuration de la communication série :', error.message);
  }
}

setupSerialCommunication();


// Utilisation des routes
app.use('/api', pointageRoute);
app.use('/api', userRoutes); // Prefixe les routes par /api
app.use('/api/auth', authRoutes);
app.use('/api', alerteRoutes);
app.use('/api', alertRoute);
app.use('/uploads', express.static('uploads'));
app.use('/alertes', alerteRoutes);
app.use('/api', sensorRoutes);

// Configuration Socket.IO
io.on('connection', (socket) => {
  console.log('Client connecté au socket');

  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });
});

app.use('/api', signalRoutes);


io.on('connection', (socket) => {
    console.log('Nouvelle connexion WebSocket:', socket.id);
  
    socket.on('rfid-scanned', (data) => {
      console.log('Carte RFID scannée:', data);
      socket.emit('rfid-status', { message: 'Carte RFID reçue avec succès', data });
    });
  
    socket.on('disconnect', () => {
      console.log('Déconnexion WebSocket:', socket.id);
    });
  });
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
