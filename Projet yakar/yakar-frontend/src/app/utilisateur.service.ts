import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface Utilisateur {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  dateCreation: Date;
}

@Injectable({
  providedIn: 'root',
})
export class UtilisateurService {
  private apiUrl = 'http://localhost:3000/api/utilisateurs';

  constructor(private http: HttpClient) {}
//afficher tout les utilisateur
  getAllUtilisateurs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/liste`).pipe(
      catchError(this.handleError)
    );
  }
//afficher un seul utilisateur
  getUtilisateurById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }


//methode pour mettre a jour utilisateur
  
  updateUtilisateur(id: string, userData: Partial<Utilisateur>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, userData).pipe(
      catchError(this.handleError)
    );
  }
//methode pour la recherche
  rechercherUtilisateurs(terme?: string, role?: string): Observable<any> {
    let params = new HttpParams();
    if (terme) params = params.set('terme', terme);
    if (role) params = params.set('role', role);

    return this.http.get(`${this.apiUrl}/recherche`, { params }).pipe(
      catchError(this.handleError)
    );
  }
//supprimer un utilisateur
  deleteUtilisateur(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
//supprimer plusieur utilisateur 
  deleteMultipleUtilisateurs(ids: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/supprimer-multiple`, { ids }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('Une erreur est survenue:', error);
    let errorMessage = 'Une erreur est survenue lors de l\'opération';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status) {
      switch (error.status) {
        case 400:
          errorMessage = error.error.message || 'Requête invalide';
          break;
        case 401:
          errorMessage = 'Non autorisé';
          break;
        case 403:
          errorMessage = 'Accès refusé';
          break;
        case 404:
          errorMessage = 'Utilisateur non trouvé';
          break;
        case 500:
          errorMessage = 'Erreur serveur';
          break;
      }
    }
    
    return throwError(() => errorMessage);
  }
}