
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { GestionpersonnelService,  NewUser  } from '../services/gestionpersonnel-services/gestionpersonnel.service';
@Component({
  selector: 'app-ajouter-personnels',
  imports: [FormsModule,CommonModule],
  providers: [GestionpersonnelService],
  templateUrl: './ajouter-personnels.component.html',
  styleUrl: './ajouter-personnels.component.css'
})
export class AjouterPersonnelsComponent {
  @Output() fermer = new EventEmitter<void>();
  @Output() userAdded = new EventEmitter<void>();
  
  prenom: string = '';
  nom: string = '';
  email: string = '';
  telephone: string = '';
  adresse: string = '';
  role: string = '';
  password: string = '';
  statut?: string;
  photo?: File;
  showPassword: boolean = false;

  emailErrorMessage: string = '';
  telephoneErrorMessage: string = '';
  
  emailValid: boolean = false;
  telephoneValid: boolean = false;
  passwordValid: boolean = true;
  formValid: boolean = false;
  
  constructor(public GestionpersonnelService: GestionpersonnelService) { }
  
  validateForm() {
    this.emailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(this.email);
    this.telephoneValid = /^(70|75|76|77|78)[0-9]{7}$/.test(this.telephone);
    this.passwordValid = this.role !== 'administrateur' || this.password.length >= 8;
    
    this.formValid = this.prenom.trim() !== '' &&
                   this.nom.trim() !== '' &&
                   this.emailValid &&
                   this.telephoneValid &&
                   this.adresse.trim() !== '' &&
                   this.role !== '' &&
                   (this.role !== 'administrateur' || this.passwordValid) &&
                   this.photo !== undefined;
  }
  
  resetErrors() {
    this.emailErrorMessage = '';
    this.telephoneErrorMessage = '';
  }
  
  // Réinitialiser les erreurs quand l'utilisateur modifie l'email
  onEmailChange() {
    this.emailErrorMessage = '';
    this.validateForm();
  }
  
  // Réinitialiser les erreurs quand l'utilisateur modifie le téléphone
  onTelephoneChange() {
    this.telephoneErrorMessage = '';
    this.validateForm();
  }
  
  checkRole() {
    if (this.role !== 'administrateur') {
      this.password = '';
      this.passwordValid = true;
    }
    this.validateForm();
  }
  
  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.photo = event.target.files[0];
      this.validateForm();
    }
  }
  
  fermerModal() {
    this.fermer.emit();
  }
  
  onSubmit() {
    if (!this.formValid) {
      alert('Veuillez corriger les erreurs avant de soumettre.');
      return;
    }
    
    const newUser: NewUser = {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      telephone: this.telephone,
      adresse: this.adresse,
      role: this.role,
      statut: 'active',
      photo: this.photo,
      mot_passe: this.password
    };
    
    this.GestionpersonnelService.addUser(newUser).subscribe(
      (response) => {
        console.log('Utilisateur créé avec succès', response);
        this.userAdded.emit();
        this.fermerModal();
      },
      (error) => {
        console.error('Erreur lors de la création de l\'utilisateur', error);
        
        // Extraire le message d'erreur de la réponse
        let errorMessage = '';
        if (error.error && error.error.message) {
          // Si l'erreur vient du serveur avec une structure standard
          errorMessage = error.error.message;
        } else if (typeof error === 'string') {
          // Si l'erreur est déjà une chaîne
          errorMessage = error;
        } else if (error.message) {
          // Si l'erreur est un objet Error standard
          errorMessage = error.message;
        } else {
          // Fallback
          errorMessage = 'Une erreur est survenue';
        }
        
        console.log('Message d\'erreur extrait:', errorMessage);
        
        // Affecter les messages d'erreur en fonction du contenu
        if (errorMessage.includes('email')) {
          this.emailErrorMessage = errorMessage;
        } else if (errorMessage.includes('téléphone')) {
          this.telephoneErrorMessage = errorMessage;
        } else {
          alert('Une erreur est survenue lors de l\'inscription: ' + errorMessage);
        }
      }
    );
  }
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}