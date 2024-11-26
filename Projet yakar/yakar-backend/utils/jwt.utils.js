// yakar-backend/utils/jwt.utils.js
const jwt = require('jsonwebtoken');
const config = require('../config/default');

class JWTUtils {
  static genererToken(utilisateur) {
    return jwt.sign(
      {
        id: utilisateur._id,
        email: utilisateur.email,
        role: utilisateur.role
      },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpiration
      }
    );
  }

  static verifierToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  static decoderToken(token) {
    return jwt.decode(token, { complete: true });
  }

  static genererTokenRefresh(utilisateur) {
    return jwt.sign(
      {
        id: utilisateur._id,
        type: 'refresh'
      },
      config.jwtSecret,
      {
        expiresIn: '7d' // Token de rafraîchissement valide 7 jours
      }
    );
  }
}

module.exports = JWTUtils;