import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/serviceslogin/auth.service';
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  message: string = ''; // Message de succès ou d'erreur
  newPasswordError: string = ''; // Erreur de validation du mot de passe
  confirmPasswordError: string = ''; // Erreur de validation du mot de passe de confirmation
  showNewPassword: boolean = false; // Contrôle de la visibilité du mot de passe
  showConfirmPassword: boolean = false; // Contrôle de la visibilité du mot de passe de confirmation
  showSuccessModal: boolean = false; // Contrôle de la visibilité du modal de succès
  successMessage: string = ''; // Message de succès


  constructor(private route: ActivatedRoute, private authService: AuthService) { }

  ngOnInit() {
    // Récupérer le token depuis l'URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
    });
  }

  // Fonction de soumission du formulaire
  onSubmit() {
    // Réinitialisation des erreurs
    this.newPasswordError = '';
    this.confirmPasswordError = '';
    this.message = ''; // Réinitialiser le message à chaque soumission

    // Validation du mot de passe (longueur minimale)
    if (this.newPassword.length < 8) {
      this.newPasswordError = 'Le mot de passe doit comporter au moins 8 caractères.';
      return;
    }

    // Validation de la correspondance des mots de passe
    if (this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    // Appel au service pour réinitialiser le mot de passe
    this.authService.resetPassword(this.token, this.newPassword, this.confirmPassword)
    .then(response => {
      this.successMessage = 'Mot de passe réinitialisé avec succès.'; // Afficher le message de succès
      this.showSuccessModal = true; // Afficher le modal de succès
      this.resetForm(); // Réinitialiser le formulaire après une soumission réussie
      this.hideMessageAfterDelay(); // Faire disparaître le message après un délai
    })
      .catch(error => {
        if (error.response && error.response.data && error.response.data.message) {
          this.message = error.response.data.message; // Afficher le message d'erreur spécifique
        } else {
          this.message = 'Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer.'; // Afficher un message d'erreur générique
        }
        console.error(error);
        this.hideMessageAfterDelay(); // Faire disparaître le message après un délai
      });
  }

  // Toggle pour afficher ou masquer le mot de passe
  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  // Toggle pour afficher ou masquer le mot de passe de confirmation
  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Validation en temps réel du mot de passe
  validatePassword() {
    if (this.newPassword.length < 8) {
      this.newPasswordError = 'Le mot de passe doit comporter au moins 8 caractères.';
    } else {
      this.newPasswordError = '';
    }
  }

  // Validation en temps réel de la confirmation du mot de passe
  validateConfirmPassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError = 'Les mots de passe ne correspondent pas.';
    } else {
      this.confirmPasswordError = '';
    }
  }

  // Réinitialiser le formulaire
  resetForm() {
    this.newPassword = '';
    this.confirmPassword = '';
    this.newPasswordError = '';
    this.confirmPasswordError = '';
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  // Faire disparaître le message après un délai
  hideMessageAfterDelay() {
    setTimeout(() => {
      this.message = '';
      this.showSuccessModal = false; // Masquer le modal de succès
    }, 5000); // 5000 millisecondes = 5 secondes
  }

  closeModal() {
    const modal = document.getElementById('resetPasswordModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  openModal() {
    const modal = document.getElementById('resetPasswordModal');
    if (modal) {
      modal.style.display = 'block';
    }
  }
}
