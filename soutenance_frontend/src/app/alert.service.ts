// alert.service.ts (Service pour interagir avec le backend Node.js)

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Alerte {
  _id?: string;
  titre: string;
  description: string;
  adresse: string;
  coordonnees: {
    latitude: number;
    longitude: number;
  };
  photos: Array<{
    chemin: string;
    dateAjout: Date;
  }>;
  statut: 'Non traité' | 'En cours' | 'Traité' | 'Annulé';
  priorite: 'Basse' | 'Moyenne' | 'Haute';
  declarant?: string;
  chauffeurAssigne?: string;
  dateCreation?: Date;
  dateAssignation?: Date;
  dateTraitement?: Date;
}

export interface Driver {
  _id: string;
  nom: string;
  prenom: string;
  disponible: boolean;
  role: string;
}



@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private apiUrl = 'http://localhost:3000/api/alertes'; // URL de ton backend Node.js

  constructor(private http: HttpClient) {}

  getAlerts(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  shareLocation(locationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/share-location`, locationData);
  }
}
