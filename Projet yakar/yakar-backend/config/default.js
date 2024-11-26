// yakar-backend/config/default.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/yakar',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: '2h',
  allowedOrigins: ['http://localhost:4200'] // Pour Angular
  
};