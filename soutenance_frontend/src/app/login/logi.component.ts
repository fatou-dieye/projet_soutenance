import { Component } from '@angular/core';
import { AuthService } from '../services/serviceslogin/auth.service';
import { Router } from '@angular/router';


import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-logi',
  imports: [CommonModule,FormsModule],
  templateUrl: './logi.component.html',
  styleUrl: './logi.component.css'
})
export class LogiComponent {
  identifiant: string = ''; // Peut contenir un email ou un téléphone
  mot_passe: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  // Vérifie si l'identifiant est un email
  isEmail(identifiant: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifiant);
  }

  // Vérifie si l'identifiant est un téléphone
  isTelephone(identifiant: string): boolean {
    const telephoneRegex = /^\d{9}$/; // Exemple : 10 chiffres pour un téléphone
    return telephoneRegex.test(identifiant);
  }

  onSubmit() {
    if (!this.identifiant || !this.mot_passe) {
      this.errorMessage = "Veuillez remplir tous les champs.";
      return;
    }

    // Déterminer si l'identifiant est un email ou un téléphone
    const isEmail = this.isEmail(this.identifiant);
    const isTelephone = this.isTelephone(this.identifiant);

    if (!isEmail && !isTelephone) {
      this.errorMessage = "Veuillez entrer un email ou un téléphone valide.";
      return;
    }

    // Appeler le service d'authentification
    const email = isEmail ? this.identifiant : null;
    const telephone = isTelephone ? this.identifiant : null;

    this.authService.login(email, telephone, this.mot_passe).subscribe({
      next: (response) => {
        this.router.navigate(['/dasbordadmin']); // Rediriger vers le tableau de bord après connexion
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Erreur lors de la connexion';
      }
    });
  }
}
