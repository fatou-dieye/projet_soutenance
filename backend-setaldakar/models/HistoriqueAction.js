// models/historiqueAction.model.js
const mongoose = require('mongoose');

const historiqueActionSchema = new mongoose.Schema({
    adminId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Utilisateur', 
        required: true 
    },
    action: { 
        type: String, 
        required: true 
    },
    cibleId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Utilisateur', 
        required: false 
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    details: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('HistoriqueAction', historiqueActionSchema);
