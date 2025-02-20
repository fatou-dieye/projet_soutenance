require('dotenv').config(); // Charger les variables d'environnement
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database'); // Connexion à la base de données
const userRoutes = require('./route/route-utilisateur'); // Routes des utilisateurs
const authRoutes = require('./route/route-utilisateur');

// Initialiser Express
const app = express();  // Cette ligne doit venir AVANT toute utilisation de app

// Middleware
app.use(cors()); // Pour gérer les CORS
app.use(express.json()); // Pour parser les données JSON envoyées dans le corps de la requête

// Connexion à MongoDB
connectDB();

// Utilisation des routes
app.use('/api', userRoutes); // Prefixe les routes par /api
app.use('/api/auth', authRoutes);
// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});