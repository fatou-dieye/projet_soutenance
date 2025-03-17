import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/serviceslogin/auth.service';
@Component({
  selector: 'app-forgetpassword',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgetpassword.component.html',
  styleUrls: ['./forgetpassword.component.css']
})
export class ForgetpasswordComponent {
  email: string = '';
  message: string = '';
  emailError: string = '';
  showModal: boolean = true;

  constructor(private authService: AuthService) {}

  // Vérifie si l'identifiant est un email
  isEmail(identifiant: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifiant);
  }

  // Méthode appelée lors de la saisie en temps réel
  checkEmail() {
    this.emailError = ''; // Réinitialise l'erreur avant chaque nouvelle vérification
    if (!this.isEmail(this.email)) {
      this.emailError = 'Veuillez entrer un email  valide.';
    }
  }

  onSubmit() {
    this.emailError = '';  // Réinitialiser les erreurs
    this.message = '';     // Réinitialiser les messages de succès

    // Vérifie si l'email est valide avant d'envoyer la requête
    if (this.emailError) {
      return; // Ne pas soumettre si l'email est invalide
    }

    // Appel à la méthode de réinitialisation du mot de passe via l'API
    this.authService.requestResetPassword(this.email)
      .then(response => {
        console.log("Réponse du serveur:", response); // Affiche la réponse du serveur
        if (response && response.message) {
          this.message = response.message;
          setTimeout(() => {
            this.resetForm();  // Réinitialise le formulaire après avoir affiché le message
          }, 3000);  // Délai de 3000ms pour permettre à Angular de rafraîchir l'UI
        } else {
          this.message = 'Erreur inconnue, veuillez réessayer.';
        }
      })
      .catch(error => {
        console.error("Erreur:", error);
        if (error.response && error.response.status === 404) {
          this.emailError = 'Aucun utilisateur trouvé avec cet email.';
        } else {
          this.message = 'Erreur lors de la demande de réinitialisation. Veuillez réessayer.';
        }
      });
  }

  resetForm() {
    this.email = '';
    this.emailError = '';
    this.message = '';
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }
}