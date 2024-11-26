import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    try {
      // Vérifier token
      const token = this.authService.getToken();
      if (!token) {
        console.log('AuthGuard: Token manquant');
        this.router.navigate(['/login']);
        return false;
      }

      // Vérifier utilisateur
      const utilisateur = this.authService.getUtilisateur();
      if (!utilisateur) {
        console.log('AuthGuard: Données utilisateur manquantes');
        this.router.navigate(['/login']);
        return false;
      }

      // Parser et vérifier les données utilisateur
      const user = JSON.parse(utilisateur);
      console.log('AuthGuard: Utilisateur authentifié:', user);

      if (!user.role) {
        console.log('AuthGuard: Rôle manquant');
        this.router.navigate(['/login']);
        return false;
      }

      // Si l'utilisateur a un rôle valide, autoriser l'accès
      if (user.role === 'administrateur' || user.role === 'utilisateur') {
        return true;
      }

      console.log('AuthGuard: Rôle non autorisé');
      this.router.navigate(['/login']);
      return false;

    } catch (error) {
      console.error('AuthGuard: Erreur:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}