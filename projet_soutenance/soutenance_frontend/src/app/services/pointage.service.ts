import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import axiosInstance from '../../environnement/axios';
import { Observable, from } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
  })
  export class PointageService {
    constructor(private router: Router) {}


    getAllGardiens(): Observable<any> {
      return from(axiosInstance.get('/all-gardiens', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }));
    }
    
      
      assignRFID(carte_rfid: string, guard_id: string): Observable<any> {
        console.log('Valeur de carte_rfid:', carte_rfid); // Logge la valeur de carte_rfid
        console.log('Valeur de guard_id:', guard_id); // Logge la valeur de guard_id
        
        const body = { carte_rfid, guard_id };
        
        return from(axiosInstance.post('/assign-rfid', body, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        })).pipe(
          catchError((error) => {
            // Affichage des erreurs dans la console uniquement pour des erreurs générales
            console.error('Erreur lors de l\'appel à l\'API:', error.response ? error.response.data : error.message);
            
            // Gestion des erreurs spécifiques côté frontend
            let errorMessage = 'Erreur lors de l\'assignation de la carte RFID';
            
            // Si l'erreur contient une réponse avec un message spécifique
            if (error.response && error.response.data && error.response.data.error) {
              errorMessage = error.response.data.error; // Message spécifique renvoyé par le backend
            }
            
            // Afficher l'erreur dans l'interface utilisateur (sur le modal)
            throw new Error(errorMessage);
          })
        );
      
      }

        // Bloquer une carte RFID
  blockRFID(guard_id: string): Observable<any> {
    const body = { guard_id };

    return from(axiosInstance.post('/block-rfid', body, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    })).pipe(
      catchError((error) => {
        console.error('Erreur lors du blocage de la carte RFID:', error.response ? error.response.data : error.message);
        
        let errorMessage = 'Erreur lors du blocage de la carte RFID';
        
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
        
        throw new Error(errorMessage);
      })
    );
  }

  // Débloquer une carte RFID
  unblockRFID(guard_id: string): Observable<any> {
    const body = { guard_id };

    return from(axiosInstance.post('/unblock-rfid', body, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    })).pipe(
      catchError((error) => {
        console.error('Erreur lors du déblocage de la carte RFID:', error.response ? error.response.data : error.message);
        
        let errorMessage = 'Erreur lors du déblocage de la carte RFID';
        
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
        
        throw new Error(errorMessage);
      })
    );
  }
      
      
     // Fonction pour enregistrer le pointage
  recordAttendance(carte_rfid: string, guard_id: string, location: string): Observable<any> {
    console.log('Valeur de carte_rfid:', carte_rfid);
    console.log('Valeur de guard_id:', guard_id);
    console.log('Valeur de location:', location);

    const body = { carte_rfid, guard_id, location };

    return from(
      axiosInstance.post('/record-attendance', body, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
    ).pipe(
      catchError((error) => {
        console.error('Erreur lors de l\'appel à l\'API:', error.response ? error.response.data : error.message);
        let errorMessage = 'Erreur lors de l\'enregistrement du pointage';
        if (error.response && error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error; // Message d'erreur spécifique
        }
        throw new Error(errorMessage);
      })
    );
  }

  // Récupérer le pointage du jour
getTodayAttendance(): Observable<any> {
  return from(axiosInstance.get('/getTodayAttendanceRecords', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    }
  })).pipe(
    tap((response) => {
      console.log('Réponse du pointage du jour:', response);
    }),
    catchError((error) => {
      console.error('Erreur lors de la récupération des pointages du jour:', error.response ? error.response.data : error.message);
      let errorMessage = 'Erreur lors de la récupération des pointages du jour';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      throw new Error(errorMessage);
    })
  );
}

 // Récupérer les pointages par date
getAttendanceByDate(date: string): Observable<any> {
  return from(axiosInstance.get(`/attendance-by-date?date=${date}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    }
  })).pipe(
    tap((response) => {
      console.log(`Réponse pour la date ${date}:`, response);
    }),
    catchError((error) => {
      console.error(`Erreur lors de la récupération des pointages pour la date ${date}:`, error.response ? error.response.data : error.message);
      let errorMessage = `Erreur lors de la récupération des pointages pour la date ${date}`;
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      throw new Error(errorMessage);
    })
  );
}

// Récupérer les enregistrements de pointage
getAttendanceRecords(): Observable<any> {
  return from(axiosInstance.get(`/attendance-records`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,  // Récupération du token d'authentification
    }
  })).pipe(
    catchError((error) => {
      console.error('Erreur lors de l\'appel API pour récupérer les pointages:', error.response ? error.response.data : error.message);
      
      // Récupérer un message d'erreur plus spécifique si disponible
      let errorMessage = 'Erreur lors de la récupération des pointages';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error; // Message d'erreur spécifique
      }
      
      // Propager l'erreur avec un message spécifique
      throw new Error(errorMessage);  // Utilisation de throwError avec l'API moderne
    })
  );
}
  

}