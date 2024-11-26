import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {  Router } from '@angular/router';



@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';  // URL de l'API pour les requêtes d'authentification
  private tokenKey = 'token';  // Clé pour stocker le token dans localStorage
  private utilisateurKey = 'utilisateur';  // Clé pour stocker les informations de l'utilisateur dans localStorage

  constructor(private http: HttpClient, private router: Router
  ) {}

  /**
   * Vérifie si `localStorage` est disponible dans le navigateur
   * @returns `true` si `localStorage` est disponible, `false` sinon
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__test__'; // Une clé temporaire pour tester l'accès
      window.localStorage.setItem(testKey, testKey);  // Essaie d'ajouter un élément
      window.localStorage.removeItem(testKey);  // Supprime cet élément
      return true;  // Si aucune exception n'a été lancée, localStorage est disponible
    } catch (e) {
      return false;  // Si une exception est lancée, cela signifie que localStorage n'est pas disponible
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   * @param nom Nom de l'utilisateur
   * @param prenom Prénom de l'utilisateur
   * @param email Email de l'utilisateur
   * @param motPasse Mot de passe de l'utilisateur
   * @param codeSecret Code secret de l'utilisateur
   * @param role Rôle de l'utilisateur (ex : 'utilisateur', 'administrateur')
   * @returns Observable contenant la réponse du serveur
   */
  inscription(nom: string, prenom: string, email: string, motPasse: string, codeSecret: string, role: string): Observable<any> {return this.http.post(`${this.apiUrl}/inscription`, {
      nom,
      prenom,
      email,
      mot_passe: motPasse,
      code_secret: codeSecret,
      role,
    });
  }

  /**
   * Connexion avec email et mot de passe
   * @param email Email de l'utilisateur
   * @param motPasse Mot de passe de l'utilisateur
   * @returns Observable contenant la réponse du serveur
   */
  connexionEmail(email: string, motPasse: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/connexion/email`, {
      email,
      mot_passe: motPasse,
    });
  }

  /**
   * Connexion avec un code secret
   * @param codeSecret Code secret de l'utilisateur
   * @returns Observable contenant la réponse du serveur
   */
  connexionCode(codeSecret: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/connexion/code`, {
      code_secret: codeSecret,
    });
  }

  /**
   * Récupère le profil utilisateur connecté
   * @returns Observable contenant les données du profil utilisateur
   */
  getProfil(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profil`);
  }

  /**
   * Vérifie si l'utilisateur est connecté en vérifiant le token et les infos utilisateur
   * @returns `true` si l'utilisateur est connecté, sinon `false`
   */
  isLoggedIn(): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;  // Si localStorage n'est pas disponible, l'utilisateur n'est pas connecté
    }
    return !!this.getToken() && !!this.getUtilisateur();  // Vérifie si le token et les infos utilisateur existent
  }

  /**
   * Récupère le token d'authentification dans localStorage
   * @returns Le token si disponible, sinon `null`
   */
  getToken(): string | null {
    return this.isLocalStorageAvailable()
      ? window.localStorage.getItem(this.tokenKey)
      : null;  // Retourne le token stocké dans localStorage ou `null` si non disponible
  }

 /**
   * Cette méthode extrait et décode le token pour récupérer les informations utilisateur
   */
 getUserFromToken(): any {
  try {
    const token = this.getToken();
    const userStr = this.getUtilisateur(); // Récupérer aussi les infos utilisateur du localStorage

    if (token && userStr) {
      // Essayer d'abord de récupérer depuis les infos utilisateur stockées
      const user = JSON.parse(userStr);
      if (user && user.nom && user.prenom) {
        return user;
      }

      // Sinon, essayer de récupérer depuis le token
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Token payload:', payload);
        return {
          ...payload,
          nom: payload.nom || user?.nom,
          prenom: payload.prenom || user?.prenom,
          role: payload.role || user?.role
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

  /**
   * Enregistre le token dans localStorage
   * @param token Token à enregistrer
   */
  setToken(token: string): void {
    if (this.isLocalStorageAvailable()) {
      window.localStorage.setItem(this.tokenKey, token);  // Enregistre le token dans localStorage
    }
  }

  /**
   * Supprime le token de localStorage
   */
  clearToken(): void {
    if (this.isLocalStorageAvailable()) {
      window.localStorage.removeItem(this.tokenKey);  // Supprime le token de localStorage
    }
  }

  /**
   * Récupère les informations utilisateur dans localStorage
   * @returns Les informations utilisateur en tant que chaîne JSON ou `null` si non disponibles
   */
  getUtilisateur(): string | null {
    return this.isLocalStorageAvailable()
      ? window.localStorage.getItem(this.utilisateurKey)
      : null;  // Retourne les informations utilisateur ou `null` si non disponibles
  }

  /**
   * Enregistre les informations utilisateur dans localStorage
   * @param utilisateur Informations utilisateur à enregistrer en tant que chaîne JSON
   */
  setUtilisateur(utilisateur: string): void {
    if (this.isLocalStorageAvailable()) {
      window.localStorage.setItem(this.utilisateurKey, utilisateur);  // Enregistre les informations utilisateur dans localStorage
    }
  }

  /**
   * Supprime les informations utilisateur de localStorage
   */
  clearUtilisateur(): void {
    if (this.isLocalStorageAvailable()) {
      window.localStorage.removeItem(this.utilisateurKey);  // Supprime les informations utilisateur de localStorage
    }
  }

  handleLoginSuccess(response: any) {
    if (response.success && response.utilisateur) {
      this.setToken(response.token);
      this.setUtilisateur(JSON.stringify(response.utilisateur));
      
      // Rediriger en fonction du rôle
      const user = response.utilisateur;
      if (user.role === 'administrateur') {
        this.router.navigate(['/dashboard-admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }
}
