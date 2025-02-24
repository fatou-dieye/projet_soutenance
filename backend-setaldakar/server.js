
require('dotenv').config();

//server.js
require('dotenv').config(); // Charger les variables d'environnement
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database'); // Connexion à la base de données
const userRoutes = require('./route/route-utilisateur'); // Routes des utilisateurs
const authRoutes = require('./route/route-utilisateur');
const alerteRoutes = require('./route/alerteRoutes');
// Initialiser Express
const app = express();  // Cette ligne doit venir AVANT toute utilisation de app


const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('JWT_SECRET is not defined');
    process.exit(1);
}



// Middleware
app.use(cors()); // Pour gérer les CORS
app.use(express.json()); // Pour parser les données JSON envoyées dans le corps de la requête

// Connexion à MongoDB
connectDB();

// Utilisation des routes
app.use('/api', userRoutes); // Prefixe les routes par /api
app.use('/api/auth', authRoutes);



app.use('/api', alerteRoutes);
// Configurer les dossiers statiques pour les photos
app.use('/uploads', express.static('uploads'));
// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});