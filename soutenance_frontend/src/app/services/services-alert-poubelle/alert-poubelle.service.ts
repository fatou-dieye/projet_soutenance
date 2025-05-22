import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import axiosInstance from '../../../environnement/axios';
import { Observable } from 'rxjs';

export interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  statut: string;
  photo?: string;

  mot_passe?: string;
  adresse: string;
}


export interface AlertModalData {
  show: boolean;
  message: string;
  niveau?: number;
}
@Injectable({
  providedIn: 'root'
})
export class AlertPoubelleService {
  private alertModalSubject = new Subject<AlertModalData>();

  constructor() { }

//recuperer tout les alerte des poubels
  // Récupérer toutes les alertes
  getAlerts(): Observable<any[]> {
    return new Observable((observer) => {
      axiosInstance.get('/alerts')
        .then((response) => {
          observer.next(response.data); // Retourner les données des alertes
          observer.complete();
        })
        .catch((error) => {
          observer.error(error); // Retourner l'erreur
        });
    });
  }



  // Récupérer tous les utilisateurs
  getAllUsers(): Observable<User[]> {
    return new Observable((observer) => {
      axiosInstance.get('/users')
        .then((response) => {
          observer.next(response.data); // Retourner les données des utilisateurs
          observer.complete();
        })
        .catch((error) => {
          observer.error(error); // Retourner l'erreur
        });
    });
  }

  // Récupérer un utilisateur par son ID
  getUserById(id: string): Observable<User> {
    return new Observable((observer) => {
      axiosInstance.get(`/users/${id}`)
        .then((response) => {
          observer.next(response.data); // Retourner les données de l'utilisateur
          observer.complete();
        })
        .catch((error) => {
          observer.error(error); // Retourner l'erreur
        });
    });
  }

  // Récupérer tous les gardiens
  getGardiens(): Observable<User[]> {
    return new Observable((observer) => {
      this.getAllUsers().subscribe(
        (users) => {
          const gardiens = users.filter(user => user.role === 'gardient');
          observer.next(gardiens);
          observer.complete();
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }
 // Récupérer tous les videurs
 getVideurs(): Observable<User[]> {
  return new Observable((observer) => {
    this.getAllUsers().subscribe(
      (users) => {
        const videurs = users.filter(user => user.role === 'videur');
        observer.next(videurs);
        observer.complete();
      },
      (error) => {
        observer.error(error);
      }
    );
  });
}

// Mettre à jour une alerte (assigner à un videur)
updateAlert(alertId: string, updateData: any): Observable<any> {
  return new Observable((observer) => {
    axiosInstance.put(`/alerts/${alertId}`, updateData)
      .then((response) => {
        observer.next(response.data);
        observer.complete();
      })
      .catch((error) => {
        observer.error(error);
      });
  });
}
  // Ajouter un dépôt
  addDepot(depotData: any) {
    return axiosInstance.post('/depots', depotData);
  }

  // Dans AlertPoubelleService, ajoutez cette méthode
getDepotsCount(): Observable<number> {
  return new Observable((observer) => {
    axiosInstance.get('/depots/count')
      .then((response) => {
        observer.next(response.data.count);
        observer.complete();
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération du nombre de dépôts:', error);
        observer.error(error);
      });
  });
}




 // Observable pour l'état de la modale
 getAlertModalState() {
  return this.alertModalSubject.asObservable();
}

// Afficher la modale
showModal(message: string, niveau?: number) {
  this.alertModalSubject.next({ show: true, message, niveau });
  
  // Fermer automatiquement la modale après 2 secondes
  setTimeout(() => {
    this.closeModal();
  }, 4000);
}

// Fermer la modale
closeModal() {
  this.alertModalSubject.next({ show: false, message: '' });
}

// ✅ Nouveau : récupérer les gardiens disponibles pour une zone
getAvailableGardiensByZone(adresse: string): Observable<any[]> {
  return new Observable((observer) => {
    axiosInstance.get('/gardiens-disponibles', { params: { adresse } })
      .then((response) => {
        observer.next(response.data);
        observer.complete();
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération des gardiens disponibles :', error);
        observer.error(error);
      });
  });
 }
}
