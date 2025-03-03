
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { GestionpersonnelService,  NewUser  } from '../gestionpersonnel-services/gestionpersonnel.service';
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
  photo?: File;  // Utilisez File pour le type de photo
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

  checkRole() {
    if (this.role !== 'administrateur') {
      this.password = '';
      this.passwordValid = true;
    }
    this.validateForm();
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.photo = event.target.files[0]; // Récupérer le fichier sélectionné
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
  
    // Créer un objet NewUser avec les données du formulaire
    const newUser: NewUser = {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      telephone: this.telephone,
      adresse: this.adresse,
      role: this.role,
      statut: 'active',
      photo: this.photo, // Assurez-vous que this.photo est un objet File
      mot_passe: this.password
    };
  
    // Appeler la méthode addUser du service
    this.GestionpersonnelService.addUser(newUser).subscribe(
      (response) => {
        console.log('Utilisateur créé avec succès', response);
        this.userAdded.emit();
        this.fermerModal();
      },
      (error) => {
        console.error('Erreur lors de la création de l\'utilisateur', error);
      }
    );
  }
  }
  
