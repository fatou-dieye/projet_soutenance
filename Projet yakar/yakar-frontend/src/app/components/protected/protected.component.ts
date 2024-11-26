// src/app/components/protected/protected.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { Utilisateur } from '../../models/utilisateur.model';

@Component({
  selector: 'app-protected',
  templateUrl: './protected.component.html',
  styleUrls: ['./protected.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class ProtectedComponent implements OnInit {
  userData: Utilisateur | null = null;
  isLoading = false;
  formStatusMessage: { type: 'success' | 'error'; text: string } | null = null;

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    this.isLoading = true;
    this.formStatusMessage = null;

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.userData = JSON.parse(userStr);
        this.isLoading = false;
      } catch (error) {
        this.formStatusMessage = {
          type: 'error',
          text: 'Erreur lors du chargement des données utilisateur'
        };
        this.isLoading = false;
        console.error('Erreur de chargement des données:', error);
      }
    } else {
      this.formStatusMessage = {
        type: 'error',
        text: 'Aucune donnée utilisateur trouvée'
      };
      this.isLoading = false;
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    try {
      this.authService.clearToken();
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      this.formStatusMessage = {
        type: 'error',
        text: 'Erreur lors de la déconnexion'
      };
    }
  }

  // Helpers pour la template
  isAdmin(): boolean {
    return this.userData?.role === 'administrateur';
  }

  isUser(): boolean {
    return this.userData?.role === 'utilisateur';
  }

  getUserRole(): string {
    return this.userData?.role === 'administrateur' ? 'administrateur' : 'utilisateur';
  }
}