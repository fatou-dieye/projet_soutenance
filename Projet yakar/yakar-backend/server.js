const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const http = require('http');
const socketIO = require('socket.io');
const config = require('./config/default');
const Mesure = require('./models/mesure.model');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: config.allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: config.allowedOrigins
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(config.mongoURI)
  .then(() => console.log('Connexion à MongoDB réussie'))
  .catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Arduino Configuration
let port;
let parser;
let lastSavedHour = new Date().getHours();
const SCHEDULED_HOURS = [10, 14, 17];
const SAVE_INTERVAL = 60 * 60 * 1000; // 1 heure en millisecondes
let lastSaveTime = Date.now();

try {
  port = new SerialPort.SerialPort({
    path: '/dev/ttyUSB0',
    baudRate: 9600
  });

  parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  parser.on('data', async (data) => {
    try {
      console.log('Données brutes reçues:', data);
      // if (!data.startsWith('{') || !data.endsWith('}')) {
      //   console.log('Données JSON invalides, ignorées');
      //   return;
      // }

      const mesure = JSON.parse(data.trim());
      const now = new Date();
      const currentHour = now.getHours();

      if (!mesure.temperature || !mesure.humidite ||
          isNaN(mesure.temperature) || isNaN(mesure.humidite)) {
        throw new Error('Données manquantes ou invalides');
      }

      const realTimeData = {
        temperature: mesure.temperature,
        humidite: mesure.humidite,
        etatVentilateur: mesure.etatVentilateur || false,
        horodatage: now,
        alerteTemperature: mesure.temperature > 27
      };
      console.log('Données traitées:', realTimeData);
      io.emit('temperature_update', realTimeData);

      // Sauvegarde programmée
      const currentTime = Date.now();
      if (SCHEDULED_HOURS.includes(currentHour) && currentHour !== lastSavedHour) {
        await saveMeasurement(realTimeData, `${currentHour}:00`);
        lastSavedHour = currentHour;
      }
      // Sauvegarde horaire
      else if (currentTime - lastSaveTime >= SAVE_INTERVAL) {
        await saveMeasurement(realTimeData);
        lastSaveTime = currentTime;
      }

    } catch (error) {
      console.error('Erreur de traitement:', error.message, 'Data:', data);
    }
  });

  port.on('error', (err) => {
    console.error('Erreur port série:', err);
  });

} catch (error) {
  console.error('Erreur initialisation port série:', error);
}

async function saveMeasurement(data, heurePrevue = null) {
  try {
    const mesure = new Mesure({
      ...data,
      heurePrevue
    });
    await mesure.save();
    console.log('Mesure enregistrée:', {
      temperature: data.temperature,
      humidite: data.humidite,
      horodatage: data.horodatage,
      heurePrevue
    });
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
  }
}

// Routes
const authRoutes = require('./routes/auth.routes');
const utilisateurRoutes = require('./routes/utilisateur.routes');
const mesureRoutes = require('./routes/mesure.routes');

app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API YAKAR' });
});

app.use('/api/auth', authRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/mesures', mesureRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(`Erreur: ${err.stack}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.url}`
  });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Nouvelle connexion WebSocket');

  socket.on('error', (error) => {
    console.error('Erreur WebSocket:', error);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté');
  });
});

// Server startup
server.listen(config.port, () => {
  console.log(`Serveur démarré sur le port ${config.port}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Arrêt du serveur...');

  try {
    await server.close();
    console.log('Serveur HTTP fermé');

    if (port) {
      await port.close();
      console.log('Port série fermé');
    }

    await mongoose.connection.close(false);
    console.log('MongoDB déconnecté');

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'arrêt:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
