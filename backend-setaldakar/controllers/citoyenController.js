const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/citoyen');
const { logAction } = require('./historiqueController');

// Fonction pour valider le format de l'email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Fonction pour valider le numéro de téléphone
function isValidPhoneNumber(phone) {
    const phoneRegex = /^(70|76|77|78|75)\d{7}$/;
    return phoneRegex.test(phone);
}

// Inscription d'un nouvel utilisateur
exports.registerUser = async (req, res) => {
    try {
        const { prenom, nom, email, telephone, adresse, password } = req.body;

        // Vérifiez que toutes les données nécessaires sont présentes
        if (!prenom || !nom || !email || !telephone || !adresse || !password) {
            return res.status(400).json({ message: 'Toutes les informations sont requises.' });
        }

        // Vérification du format de l'email et du téléphone
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Format d\'email invalide.' });
        }

        if (!isValidPhoneNumber(telephone)) {
            return res.status(400).json({ message: 'Numéro de téléphone invalide.' });
        }

        // Vérification si l'email ou le téléphone existe déjà
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
        }

        const existingUserByPhone = await User.findOne({ telephone });
        if (existingUserByPhone) {
            return res.status(400).json({ message: 'Ce numéro de téléphone est déjà utilisé.' });
        }

        // Vérification de la force du mot de passe
        if (password.length < 6) {
            return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
        }

        // Hachage du mot de passe avant enregistrement
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Mot de passe haché lors de l\'inscription :', hashedPassword);

        // Création de l'utilisateur
        const newUser = new User({ prenom, nom, email, telephone, adresse, password: hashedPassword });
        await newUser.save();

        // Enregistrement de l'action dans l'historique
        await logAction(newUser._id, "Inscription réussie");

        res.status(201).json({ message: 'Utilisateur enregistré avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Connexion d'un utilisateur
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérification des informations de connexion
        if (!email || !password) {
            return res.status(400).json({
                message: 'Veuillez fournir un email et un mot de passe valides.'
            });
        }

        // Rechercher l'utilisateur par email
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé avec cet email.' });
        }

        // Vérification du mot de passe
        const validPassword = await bcrypt.compare(password.trim(), user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Mot de passe incorrect. Réessayez." });
        }

        // Log pour vérifier la clé secrète
        console.log('JWT Secret:', process.env.JWT_SECRET);

        // Générer le token JWT
        const token = jwt.sign(
            { id: user._id, roles: user.roles },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Envoi du token dans un cookie sécurisé
        res.cookie('AUTH_COOKIE', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000 // 1 heure
        });

        // Enregistrer l'action de connexion dans l'historique
        await logAction(user._id, "Connexion réussie");

        // Réponse avec les informations de l'utilisateur et le token
        res.status(200).json({
            message: 'Connexion réussie.',
            user: {
                id: user._id,
                prenom: user.prenom,
                nom: user.nom,
                email: user.email,
                telephone: user.telephone,
                adresse: user.adresse,
                role: user.roles?.[0] || 'utilisateur',
                status: user.status,
                createdAt: user.createdAt,
                date_modification: user.date_modification
            }
        });
    } catch (error) {
        console.error('Erreur lors de la tentative de connexion :', error);
        return res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// Mise à jour des informations de l'utilisateur
exports.updateUserInfo = async (req, res) => {
    try {
        const userId = req.user._id; // Supposons que l'ID de l'utilisateur est disponible dans req.user après la connexion
        const { prenom, nom, email, telephone, adresse } = req.body;

        // Vérification des données fournies
        if (!prenom && !nom && !email && !telephone && !adresse) {
            return res.status(400).json({ message: 'Aucune information à mettre à jour.' });
        }

        // Vérification du format de l'email et du téléphone si fournis
        if (email && !isValidEmail(email)) {
            return res.status(400).json({ message: 'Format d\'email invalide.' });
        }

        if (telephone && !isValidPhoneNumber(telephone)) {
            return res.status(400).json({ message: 'Numéro de téléphone invalide.' });
        }

        // Rechercher l'utilisateur par ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Mettre à jour les informations de l'utilisateur
        if (prenom) user.prenom = prenom;
        if (nom) user.nom = nom;
        if (email) user.email = email;
        if (telephone) user.telephone = telephone;
        if (adresse) user.adresse = adresse;

        // Enregistrer les modifications
        await user.save();

        // Enregistrer l'action dans l'historique
        await logAction(user._id, "Informations de l'utilisateur mises à jour");

        res.status(200).json({ message: 'Informations mises à jour avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des informations :', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};
