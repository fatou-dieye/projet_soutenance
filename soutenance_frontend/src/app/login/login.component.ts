import { Component } from '@angular/core';

import { AuthService } from '../services/serviceslogin/auth.service';
import { Router } from '@angular/router';


import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  imports: [CommonModule,FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  identifiant: string = ''; // Peut contenir un email ou un téléphone
  mot_passe: string = '';
  errorMessage: string = '';
  identifiantError: string = '';
  passwordError: string = '';
  showPassword: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  // Vérifie si l'identifiant est un email
  isEmail(identifiant: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifiant);
  }

  // Vérifie si l'identifiant est un téléphone
  isTelephone(identifiant: string): boolean {
    const telephoneRegex = /^(70|75|76|77|78)\d{7}$/; // Doit commencer par 70, 75, 76, 77, ou 78 et avoir 9 chiffres
    return telephoneRegex.test(identifiant);
  }

  async validateIdentifiant() {
    if (this.isEmail(this.identifiant) || this.isTelephone(this.identifiant)) {
      try {
        const result = await this.authService.checkExistence(
          this.isEmail(this.identifiant) ? this.identifiant : '',
          this.isTelephone(this.identifiant) ? this.identifiant : ''
        );
        if (!result.exists) {
          this.identifiantError = 'Utilisateur non trouvé.';
        } else {
          this.identifiantError = '';
        }
      } catch (error) {
        this.identifiantError = 'Erreur lors de la vérification de l\'email ou du téléphone.';
      }
    } else {
      this.identifiantError = 'Veuillez entrer un email ou un téléphone valide.';
    }
  }

  validatePassword() {
    if (this.mot_passe.length < 8) {
      this.passwordError = 'Le mot de passe doit contenir au moins 8 caractères.';
    } else {
      this.passwordError = '';
    }
  }

  onLogin() {
    if (!this.identifiantError && !this.passwordError) {
      if (this.isEmail(this.identifiant)) {
        this.authService.login(this.identifiant, '', this.mot_passe)
          .then(() => {
            // Redirection gérée dans le service
          })
          .catch(error => {
            if (error.response && error.response.status === 404) {
              this.identifiantError = 'Utilisateur non trouvé.';
            } else if (error.response && error.response.status === 401) {
              this.passwordError = 'Mot de passe incorrect.';
            } else {
              this.errorMessage = 'Erreur lors de la connexion: ' + error.message;
            }
          });
      } else if (this.isTelephone(this.identifiant)) {
        this.authService.login('', this.identifiant, this.mot_passe)
          .then(() => {
            // Redirection gérée dans le service
          })
          .catch(error => {
            if (error.response && error.response.status === 404) {
              this.identifiantError = 'Utilisateur non trouvé.';
            } else if (error.response && error.response.status === 401) {
              this.passwordError = 'Mot de passe incorrect.';
            } else {
              this.errorMessage = 'Erreur lors de la connexion: ' + error.message;
            }
          });
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}