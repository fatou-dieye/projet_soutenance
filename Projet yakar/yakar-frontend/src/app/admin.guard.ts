import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    try {
      const utilisateur = this.authService.getUtilisateur();
      if (!utilisateur) {
        console.log('AdminGuard: Utilisateur non trouvé');
        this.router.navigate(['/login']);
        return false;
      }

      const user = JSON.parse(utilisateur);
      console.log('AdminGuard: Role utilisateur:', user.role);

      if (user.role === 'administrateur') {
        // Si c'est un admin, autoriser l'accès
        return true;
      }

      // Si c'est un utilisateur normal, rediriger vers le dashboard utilisateur
      console.log('AdminGuard: Redirection vers dashboard utilisateur');
      this.router.navigate(['/dashboard']); // modifier cette ligne
      return false;
      
    } catch (error) {
      console.error('AdminGuard: Erreur:', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}