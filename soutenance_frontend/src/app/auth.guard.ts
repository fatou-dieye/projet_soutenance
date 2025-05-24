import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './services/serviceslogin/auth.service';
@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const user = this.authService.getCurrentUser();

    if (!user) {
      // Pas connecté, redirige vers login
      return this.router.parseUrl('/login');
    }

    // Vérifie si la route attend un rôle spécifique
    const expectedRole = route.data['role'] as string | undefined;

    if (expectedRole && user.role !== expectedRole) {
      // Rôle incorrect, redirige vers login
      return this.router.parseUrl('/login');
    }

    // Tout est ok, autorise la navigation
    return true;
  }
}
