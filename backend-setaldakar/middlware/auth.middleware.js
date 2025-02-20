const jwt = require('jsonwebtoken');

const tokenBlacklist = new Set();

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Accès refusé : aucun token fourni' });
    }
     // Vérifier si le token est dans la liste noire
     if (tokenBlacklist.has(token)) {
        return res.status(401).json({ 
            message: 'Token invalide. Reconnectez-vous.',
            requireReconnection: true 
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.utilisateur = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token invalide' });
    }
};

const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!req.utilisateur) {
            return res.status(401).json({ message: 'Non autorisé' });
        }
        
        if (!roles.includes(req.utilisateur.role)) {
            return res.status(403).json({ message: 'Accès refusé : rôle insuffisant' });
        }
        
        next();
    };
};


const invalidateToken = (token) => {
    tokenBlacklist.add(token);
};


module.exports = { verifyToken, verifyRole,invalidateToken  };