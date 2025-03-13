import { Injectable } from '@angular/core';
import axiosInstance from '../../../environnement/axios';
export interface User {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  role: string;
  statut?: string;
  photo: string ;
  mot_passe?: string;
}

@Injectable({
  providedIn: 'root'
})


export class SignalService {

  constructor() {}
  
  // Méthode pour récupérer toutes les alertes
  getAlertes(statut?: string, priorite?: string, page?: number, limit?: number) {
    return axiosInstance.get('/alertes', {
      params: { statut, priorite, page, limit }
    });
  }
  
  // Méthode pour récupérer une alerte par ID
  getAlerteById(id: string) {
    return axiosInstance.get(`/alertes/${id}`);
  }
  
  // Méthode pour récupérer tous les videurs disponibles
  getVideurs() {
    return axiosInstance.get('/users', {
      params: { role: 'videur', statut: 'active' }
    });
  }
  
  // Méthode pour assigner un videur à une alerte
  assignerVideur(alerteId: string, videurId: string) {
    return axiosInstance.post(`/alertes/${alerteId}/assigner`, {
      videurId,
      envoyerEmail: true // Paramètre pour indiquer d'envoyer un email de notification
    });
  }
}
