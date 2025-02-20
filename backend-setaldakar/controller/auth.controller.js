const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Utilisateur = require('../models/utilisateur.model');

// Middleware de vérification du token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'Token manquant' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalide' });
    }
};

// Middleware de vérification des rôles
const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Accès non autorisé'
            });
        }
        next();
    };
};

module.exports = { verifyToken, verifyRole };




