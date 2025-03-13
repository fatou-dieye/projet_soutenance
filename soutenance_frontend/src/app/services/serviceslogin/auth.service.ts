import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import axiosInstance from '../../../environnement/axios';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api'; // l'URL du backend

  constructor(private http: HttpClient, private router: Router) {}

  // Méthode pour se connecter
  login(email: string | null, telephone: string | null, mot_passe: string): Observable<any> {
    const body: any = { mot_passe };
    if (email) {
      body.email = email;
    } else if (telephone) {
      body.telephone = telephone;
    }
  
    return this.http.post(`${this.apiUrl}/login`, body).pipe(
      tap((response: any) => {
        console.log('Réponse complète après connexion :', response); 
        console.log('Token reçu après connexion :', response.token);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      })
    );
  }

  // Méthode pour se déconnecter
  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => {
        // Supprimer le token et les informations utilisateur du localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.router.navigate(['/logi']); // Rediriger vers la page de connexion
      })
    );
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Récupérer l'utilisateur connecté
  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    
    return user ? JSON.parse(user) : null;
  }


     // Méthode pour changer le mot de passe
  changePassword(passwordData: {
    ancien_mot_passe: string,
    nouveau_mot_passe: string,
    confirmation_mot_passe: string
  }): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.put(`${this.apiUrl}/change-password`, passwordData, { headers });
  }
    
   // Méthode pour récupérer l'historique de l'utilisateur connecté
   getHistoriqueUtilisateur(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get(`${this.apiUrl}/historique-utilisateur`, { headers });
  }


   

  // Vérifier si l'ancien mot de passe est correct (utilisation de HttpClient)
  verifyOldPassword(ancienMotPasse: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    // Utilisation de "oldPassword" comme clé, qui est attendue côté backend
    const body = {
      oldPassword: ancienMotPasse  // Utilisez "oldPassword" au lieu de "ancien_mot_passe"
    };
  
    // Appel HTTP avec la bonne structure de données
    return this.http.post(`${this.apiUrl}/verify-old-password`, body, { headers });
  }
  
}

