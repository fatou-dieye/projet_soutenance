require('dotenv').config(); // Charger les variables d'environnement
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/database'); // Connexion à la base de données
const userRoutes = require('./route/route-utilisateur'); // Routes des utilisateurs
const authRoutes = require('./route/route-utilisateur');
const alerteRoutes = require('./route/signalRoutes');
const pointageRoute = require('./route/pointageRoute');
const alertRoute = require('./route/alertRoute');
const sensorRoutes = require('./route/sensorRoutes');

// Initialiser Express
const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200", // URL de votre Angular
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors()); // Pour gérer les CORS
app.use(express.json()); // Pour parser les données JSON envoyées dans le corps de la requête

// Connexion à MongoDB
connectDB();

// Initialiser le SensorService avec l'instance io
const SensorService = require('./services/sensorService')(io);

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

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
