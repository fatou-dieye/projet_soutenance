// depot.service.ts
import { Injectable } from '@angular/core';

import axiosInstance from '../../environnement/axios';

interface Signal {
    nom: string;
    distance: number;
    coordonnees: {
      latitude: number;
      longitude: number;
    };
  }

  interface Alerte {
    description: string;
    adresse: string;
    latitude: number;
    longitude: number;
    photos?: File[];
}

  
@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {

  constructor() { }

  getNearbyDepots(latitude: number, longitude: number) {
    return axiosInstance.get('/nearby-depots', { params: { latitude, longitude } })
      .then(response => response.data)
      .catch(error => {
        console.error('Erreur lors de la récupération des dépôts :', error);
        throw error;
      });
  }

  createAlerte(alerte: Alerte) {
    const formData = new FormData();
    formData.append('description', alerte.description);
    formData.append('adresse', alerte.adresse);
    formData.append('latitude', alerte.latitude.toString());
    formData.append('longitude', alerte.longitude.toString());
  
    if (alerte.photos) {
      alerte.photos.forEach(photo => {
        formData.append('photos', photo);
        console.log('Photo:', photo.name, photo.type, photo.size);
      });
    }
  
    console.log('FormData envoyé :', formData);
  
    return axiosInstance.post('/alertes/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => response.data)
    .catch(error => {
      console.error('Erreur lors de la création de l\'alerte :', error);
      throw error;
    });
  }
  
  getHistoriqueUtilisateur(): Promise<any> {
    const token = localStorage.getItem('token');
   

    if (!token) {
      console.error('Token manquant dans le service');
      throw new Error('Token manquant');
    }

    return axiosInstance.get('/historique-utilisateur', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      
      return response.data;
    })
    .catch(error => {
      console.error('Erreur lors de la récupération de l\'historique :', error);
      throw error;
    });
  }

  getAlertesUtilisateur(page: number = 1, limit: number = 3): Promise<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token manquant dans le service');
      throw new Error('Token manquant');
    }
  
  
    return axiosInstance.get('/alertesbyuser', {
      params: { page, limit },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      console.log('Réponse de l\'API:', response.data); // Log the response data
      return response.data;
    })
    .catch(error => {
      console.error('Erreur lors de la récupération des alertes:', error);
      if (error.response) {
        // Server responded with a status other than 2xx
        console.error('Erreur de réponse du serveur:', error.response.data);
      } else if (error.request) {
        // No response was received
        console.error('Erreur de requête:', error.request);
      } else {
        // Something else caused the error
        console.error('Erreur de configuration de la requête:', error.message);
      }
      throw error;
    });
  }
  
  registerUser(userData: any) {
    console.log('Données envoyées :', JSON.stringify(userData, null, 2)); // Journalise les données
    return axiosInstance.post('/register-simple-user', userData)
      .then(response => response.data)
      .catch(error => {
        console.error('Erreur lors de l\'inscription :', error);
        if (error.response) {
          console.error('Réponse du serveur :', error.response.data);
        }
        throw error;
      });
  }
  getTotalUsers() {
    return axiosInstance.get('/total-users')  // Appel à la route API créée
      .then(response => response.data)  // Retourne les données de la réponse
      .catch(error => {
        console.error('Erreur lors de la récupération du nombre d\'utilisateurs :', error);
        throw error;  // Jeter l'erreur pour que le composant puisse la gérer
      });
  }
 
  
  }
  
  