const mongoose = require('mongoose');
const HistoriqueAction = require('../models/HistoriqueAction');



// Fonction pour enregistrer l'action
const enregistrerAction = async (adminId, action, cibleId, details = '') => {
  try {
    const nouvelleAction = new HistoriqueAction({
      adminId,
      action,
      cibleId,
      details
    });
    await nouvelleAction.save();
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'historique :", error);
  }
};




module.exports = {
  enregistrerAction,
  // other exports if any
};