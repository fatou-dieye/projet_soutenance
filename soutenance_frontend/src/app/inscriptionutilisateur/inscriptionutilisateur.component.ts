import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { UtilisateurService } from '../services/utilisateur.service';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-inscriptionutilisateur',
  imports: [CommonModule, FormsModule  ],
  templateUrl: './inscriptionutilisateur.component.html',
  styleUrls: ['./inscriptionutilisateur.component.css']
})


export class InscriptionutilisateurComponent {
  showPassword: boolean = false;
  passwordError: string = '';
  emailError: string = '';
  telephoneError: string = '';
  nomError: string = '';
  prenomError: string = '';
  serverError: null | string = '';
  showSuccessModal: boolean = false;
  successModalMessage: string = '';

  mot_passe: string = '';
  prenom: string = '';
  nom: string = '';
  email: string = '';
  adresse: string = '';
  telephone: string = '';

  constructor(private utilisateurService: UtilisateurService) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  isEmail(identifiant: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifiant);
  }

  isTelephone(identifiant: string): boolean {
    const telephoneRegex = /^(70|75|76|77|78)\d{7}$/; // Doit commencer par 70, 75, 76, 77, ou 78 et avoir 9 chiffres
    return telephoneRegex.test(identifiant);
  }

  isAlphaSpace(value: string): boolean {
    const alphaSpaceRegex = /^[a-zA-Z\s]+$/;
    return alphaSpaceRegex.test(value);
  }

  validatePassword(mot_passe: string) {
    if (mot_passe.length < 8) {
      this.passwordError = 'Le mot de passe doit contenir au moins 8 caractères.';
    } else {
      this.passwordError = '';
    }
  }

  validateEmail(email: string) {
    if (!this.isEmail(email)) {
      this.emailError = 'Veuillez entrer un email valide.';
    } else {
      this.emailError = '';
    }
  }

  validateTelephone(telephone: string) {
    if (!this.isTelephone(telephone)) {
      this.telephoneError = 'Veuillez entrer un numéro de téléphone valide.';
    } else {
      this.telephoneError = '';
    }
  }

  validateNom(nom: string) {
    if (!this.isAlphaSpace(nom)) {
      this.nomError = 'Le nom doit contenir uniquement des lettres et des espaces.';
    } else {
      this.nomError = '';
    }
  }

  validatePrenom(prenom: string) {
    if (!this.isAlphaSpace(prenom)) {
      this.prenomError = 'Le prénom doit contenir uniquement des lettres et des espaces.';
    } else {
      this.prenomError = '';
    }
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      const userData = {
        nom: this.nom,
        prenom: this.prenom,
        email: this.email,
        mot_passe: this.mot_passe,
        adresse: this.adresse,
        telephone: this.telephone
      };

      this.utilisateurService.registerUser(userData)
        .then(response => {
          console.log('Inscription réussie :', response);
          this.serverError = null; // Réinitialiser les erreurs du serveur
          this.openSuccessModal('Inscription réussie !');
          form.resetForm(); // Réinitialiser le formulaire
          this.resetErrors(); // Réinitialiser les messages d'erreur
        })
        .catch(error => {
          console.error('Erreur lors de l\'inscription :', error);

          // Vérification de l'erreur liée à MongoDB et traitement des erreurs spécifiques
          if (error.response && error.response.data) {
            if (error.response.data.error && error.response.data.error.includes('E11000')) {
              // Vérification pour l'email déjà utilisé
              if (error.response.data.error.includes('email')) {
                this.emailError = 'Cet email est déjà utilisé.';
              }
              // Vérification pour le téléphone déjà utilisé
              else if (error.response.data.error.includes('telephone')) {
                this.telephoneError = 'Ce numéro de téléphone est déjà utilisé.';
              }
            } else {
              this.serverError = error.response.data.message || 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
            }
          } else {
            this.serverError = 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
          }
        });
    } else {
      this.serverError = 'Veuillez remplir tous les champs requis correctement.';
    }
  }

  resetErrors() {
    this.passwordError = '';
    this.emailError = ''; // Réinitialiser l'erreur email
    this.telephoneError = '';
    this.nomError = '';
    this.prenomError = '';
    this.serverError = null; // Réinitialiser les erreurs du serveur
  }

  openSuccessModal(message: string): void {
    this.successModalMessage = message;
    this.showSuccessModal = true;
    this.serverError = null; // Réinitialiser les erreurs du serveur

    setTimeout(() => {
      this.closeSuccessModal();
    }, 2000);
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }
}

