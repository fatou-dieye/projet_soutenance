import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import axiosInstance from '../../environements.ts/axios.service';
import { Observable, from } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
  })
  export class PointageService {
    constructor(private router: Router) {}


    getAllGardiens(page: number, limit: number): Observable<any> {
        return from(axiosInstance.get('/all-gardiens', {
          params: { page, limit },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Vérifie si le token est bien stocké
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
            console.error('Erreur lors de l\'appel à l\'API:', error.response || error.message);
            throw error;
          })
        );
      }
      
      recordAttendance(guard_id: string, name: string, date: string, location: string): Observable<any> {
        const body = { guard_id, name, date, location };
        return from(axiosInstance.post('/record-attendance', body, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Inclure le token dans les en-têtes
          }
        }));
  }
}