
import { GestionpersonnelService, User } from '../services/gestionpersonnel-services/gestionpersonnel.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, Input , OnInit} from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-modifier-personnels',
  imports: [FormsModule,CommonModule],
  providers: [GestionpersonnelService],
  templateUrl: './modifier-personnels.component.html',
  styleUrl: './modifier-personnels.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ModifierPersonnelsComponent  implements OnInit {
  @Input() selectedUser!: User;
  @Output() closeModal = new EventEmitter<void>();
  @Output() userModified = new EventEmitter<void>();

  prenom: string = '';
  nom: string = '';
  email: string = '';
  telephone: string = '';
  adresse: string = '';
  role: string = '';
  statut: string = '';
  photo?: File | string; 
  selectedFile: File | null = null;

  // Validation des champs
  validationErrors = {
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    role: '',
    statut: ''
  };

  // Champs touchés
  touchedFields = {
    prenom: false,
    nom: false,
    email: false,
    telephone: false,
    adresse: false,
    role: false,
    statut: false
  };

  constructor(private GestionpersonnelService: GestionpersonnelService) {}

  ngOnInit(): void {
    if (this.selectedUser) {
      this.prenom = this.selectedUser.prenom;
      this.nom = this.selectedUser.nom;
      this.email = this.selectedUser.email;
      this.telephone = this.selectedUser.telephone;
      this.adresse = this.selectedUser.adresse;
      this.role = this.selectedUser.role;
      this.statut = this.selectedUser.statut;
      this.photo = this.selectedUser.photo;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.photo = URL.createObjectURL(this.selectedFile);
    }
  }

  // Déclenché quand un champ est activé
  onFieldFocus(field: string): void {
    this.touchedFields[field as keyof typeof this.touchedFields] = true;
    this.validateField(field);
  }

  // Valider un champ spécifique
  validateField(field: string): void {
    switch(field) {
      case 'prenom':
        this.validationErrors.prenom = !this.prenom || this.prenom.trim() === '' 
          ? 'Le prénom est obligatoire' 
          : '';
        break;
      case 'nom':
        this.validationErrors.nom = !this.nom || this.nom.trim() === '' 
          ? 'Le nom est obligatoire' 
          : '';
        break;
      case 'email':
        if (!this.email || this.email.trim() === '') {
          this.validationErrors.email = 'L\'email est obligatoire';
        } else if (!this.isValidEmail(this.email)) {
          this.validationErrors.email = 'Format d\'email invalide';
        } else {
          this.validationErrors.email = '';
        }
        break;
      case 'telephone':
        if (!this.telephone || this.telephone.trim() === '') {
          this.validationErrors.telephone = 'Le téléphone est obligatoire';
        } else if (!this.isValidPhone(this.telephone)) {
          this.validationErrors.telephone = 'Le téléphone doit commencer par 70, 75, 76, 77 ou 78 et contenir 9 chiffres';
        } else {
          this.validationErrors.telephone = '';
        }
        break;
      case 'adresse':
        this.validationErrors.adresse = !this.adresse || this.adresse.trim() === '' 
          ? 'L\'adresse est obligatoire' 
          : '';
        break;
      case 'role':
        this.validationErrors.role = !this.role 
          ? 'Le rôle est obligatoire' 
          : '';
        break;
      case 'statut':
        this.validationErrors.statut = !this.statut 
          ? 'Le statut est obligatoire' 
          : '';
        break;
    }
  }

  // Vérifier si l'email est valide
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Vérifier si le téléphone est valide (Commence par 70, 75, 76, 77 ou 78 et suivi de 7 chiffres)
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^(70|75|76|77|78)\d{7}$/;
    return phoneRegex.test(phone);
  }

  // Valider tous les champs
  validateAllFields(): boolean {
    // Marquer tous les champs comme touchés
    this.touchedFields = {
      prenom: true,
      nom: true,
      email: true,
      telephone: true,
      adresse: true,
      role: true,
      statut: true
    };

    // Valider chaque champ
    this.validateField('prenom');
    this.validateField('nom');
    this.validateField('email');
    this.validateField('telephone');
    this.validateField('adresse');
    this.validateField('role');
    this.validateField('statut');

    // Vérifier si tout est valide
    return !this.validationErrors.prenom &&
           !this.validationErrors.nom &&
           !this.validationErrors.email &&
           !this.validationErrors.telephone &&
           !this.validationErrors.adresse &&
           !this.validationErrors.role &&
           !this.validationErrors.statut;
  }

  onSubmit(): void {
    if (this.validateAllFields()) {
      const updatedUser = {
        ...this.selectedUser,
        prenom: this.prenom,
        nom: this.nom,
        email: this.email,
        telephone: this.telephone,
        adresse: this.adresse,
        role: this.role,
        statut: this.statut,
        photo: this.photo
      };

      if (this.selectedFile) {
        this.GestionpersonnelService.updateUserWithFile(updatedUser, this.selectedFile).subscribe({
          next: () => {
            this.userModified.emit();
            this.closeModal.emit();
          },
          error: (error) => {
            alert('Erreur lors de la mise à jour de l\'utilisateur : ' + error.message);
          }
        });
      } else {
        this.GestionpersonnelService.updateUser(updatedUser).subscribe({
          next: () => {
            this.userModified.emit();
            this.closeModal.emit();
          },
          error: (error) => {
            alert('Erreur lors de la mise à jour de l\'utilisateur : ' + error.message);
          }
        });
      }
    }
  }

  close() {
    this.closeModal.emit();
  }
}