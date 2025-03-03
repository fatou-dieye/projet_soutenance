//servicedasbordadmin/dasbordadmin.service.ts
import { Injectable } from '@angular/core';
import axiosInstance from '../../environnement/axios';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class DasbordadminService {


  constructor() { }

  // Méthode pour récupérer les statistiques des utilisateurs
  getUserStatistics(): Observable<any> {
    return new Observable((observer) => {
      axiosInstance.get('/statistiques-utilisateurs') // Appel à l'API pour récupérer les statistiques
        .then(response => {
          observer.next(response.data);  // On retourne les données des statistiques
          observer.complete();
        })
        .catch(error => {
          observer.error(error);  // Si l'appel échoue, on retourne l'erreur
        });
    });
 
 
  }
   // Méthode pour récupérer les alertes des 7 derniers jours
   getAlertesLast7Days(): Observable<any> {
    return new Observable((observer) => {
      axiosInstance.get('/alertes/last7days')
        .then(response => {
          observer.next(response.data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }
}


