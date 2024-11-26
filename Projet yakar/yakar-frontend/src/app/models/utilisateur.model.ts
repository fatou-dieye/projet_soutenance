export interface Utilisateur {
    _id?: string;          // MongoDB ID
    nom: string;
    prenom: string;
    email: string;
    code_secret: number;
    role: 'administrateur' | 'utilisateur';
    derniereConnexion?: Date;
    dateCreation?: Date;
  }
  
  // Vous pouvez aussi ajouter des types supplémentaires si nécessaire
  export interface UtilisateurLogin {
    email: string;
    mot_passe: string;
  }
  
  export interface UtilisateurResponse {
    utilisateur: Utilisateur;
    token: string;
  }