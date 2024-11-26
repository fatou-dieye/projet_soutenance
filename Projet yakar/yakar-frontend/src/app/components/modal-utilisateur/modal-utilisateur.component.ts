// ajouter utilisateur modal
import { Component, EventEmitter, Output } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface NewUser {
  nom: string;
  prenom: string;
  email: string;
  mot_passe: string;
  code_secret: string;
  role: string;
}

interface ValidationErrors {
  required: string;
  minlength: string;
  maxlength: string;
  pattern: string;
  invalid: string;
}

@Component({
  selector: 'app-modal-utilisateur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-utilisateur.component.html',
  styleUrls: ['./modal-utilisateur.component.scss']
})
export class ModalUtilisateurComponent {
  successMessage: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<string>();
//contient des valeur par defaut de l'utilisateur que l'on doit creer
  newUser: NewUser = {
    nom: '',
    prenom: '',
    email: '',
    mot_passe: '',
    code_secret: '',
    role: 'utilisateur'
  };

  showPassword = false;
  isSubmitting = false;
  isGeneratingCode = false;
  isCheckingCode = false;
  errorMessage = '';

  // Regex patterns pour controle de saisi
  private patterns = {
    nom: /^[a-zA-ZÀ-ÿ\s-]+$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  };

  nomErrors: ValidationErrors = {
    required: 'Le nom est obligatoire.',
    minlength: 'Le nom doit avoir au moins 2 caractères.',
    maxlength: 'Le nom ne peut pas dépasser 25 caractères.',
    pattern: 'Le nom ne doit contenir que des lettres, espaces et tirets.',
    invalid: 'Le format du nom est invalide.'
  };

  prenomErrors: ValidationErrors = {
    required: 'Le prénom est obligatoire.',
    minlength: 'Le prénom doit avoir au moins 2 caractères.',
    maxlength: 'Le prénom ne peut pas dépasser 25 caractères.',
    pattern: 'Le prénom ne doit contenir que des lettres, espaces et tirets.',
    invalid: 'Le format du prénom est invalide.'
  };

  constructor(private authService: AuthService) {}
//condition de submite
  onSubmit(form: NgForm): void {
    if (form.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

    
      const formattedUser = {
        ...this.newUser,
        nom: this.formatNom(this.newUser.nom),
        prenom: this.formatPrenom(this.newUser.prenom)
      };

      this.authService.inscription(
        formattedUser.nom,
        formattedUser.prenom,
        formattedUser.email,
        formattedUser.mot_passe,
        formattedUser.code_secret,
        formattedUser.role
      ).subscribe({
        next: (response) => {
          console.log('Inscription réussie:', response);
          this.success.emit('Utilisateur ajouté avec succès');
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur lors de l\'inscription:', error);
          this.errorMessage = error?.error?.message || 'Erreur lors de l\'inscription';
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }
//validation nom
  validateNom(nom: string): { [key: string]: boolean } | null {
    const trimmedNom = nom.trim();
    
    if (!trimmedNom) {
      return { 'required': true };
    }
    if (trimmedNom.length < 2) {
      return { 'minlength': true };
    }
    if (trimmedNom.length > 50) {
      return { 'maxlength': true };
    }
    if (!this.patterns.nom.test(trimmedNom)) {
      return { 'pattern': true };
    }
    return null;
  }
//validation prenom
  validatePrenom(prenom: string): { [key: string]: boolean } | null {
    const trimmedPrenom = prenom.trim();
    
    if (!trimmedPrenom) {
      return { 'required': true };
    }
    if (trimmedPrenom.length < 2) {
      return { 'minlength': true };
    }
    if (trimmedPrenom.length > 50) {
      return { 'maxlength': true };
    }
    if (!this.patterns.nom.test(trimmedPrenom)) {
      return { 'pattern': true };
    }
    return null;
  }

  formatNom(nom: string): string {
    return nom
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  formatPrenom(prenom: string): string {
    return prenom
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  onNomInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    // Supprime les caractères non autorisés immédiatement
    value = value.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '');
    
    if (value !== input.value) {
      this.newUser.nom = value;
    }
  }

  onPrenomInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    // Supprime les caractères non autorisés immédiatement
    value = value.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '');
    
    if (value !== input.value) {
      this.newUser.prenom = value;
    }
  }
//generer code secret
  generateSecretCode(): void {
    this.isGeneratingCode = true;
    this.isCheckingCode = true;

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    this.newUser.code_secret = code;

    setTimeout(() => {
      this.isGeneratingCode = false;
      this.isCheckingCode = false;
    }, 500);
  }
//fermuture modal
  closeModal(): void {
    this.close.emit();
    
  }

}