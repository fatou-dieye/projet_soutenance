
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl,AbstractControl  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/serviceslogin/auth.service';

@Component({
  selector: 'app-changement-mots-pass',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './changement-mots-pass.component.html',
  styleUrl: './changement-mots-pass.component.css'
})
export class ChangementMotsPassComponent implements OnInit{
  
  isModalOpen = false;
  step = 1;
  errorMessage = '';
  successMessage = '';
  currentUser: any;
  
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  
  passwordForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.passwordForm = this.fb.group({
      ancien_mot_passe: ['', [Validators.required]],
      nouveau_mot_passe: ['', [Validators.required, Validators.minLength(8)]],
      confirmation_mot_passe: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
     // Écouter les changements de valeur en temps réel pour le nouveau mot de passe
     this.passwordForm.get('nouveau_mot_passe')?.valueChanges.subscribe(value => {
      this.checkPasswordLength(value);
    });
  }
  


  // Méthode pour vérifier la longueur du mot de passe en temps réel
  checkPasswordLength(password: string): void {
    const passwordControl = this.passwordForm.get('nouveau_mot_passe');
    if (passwordControl && password.length < 8) {
      passwordControl.setErrors({ minlength: true });
    } else {
      passwordControl?.setErrors(null);
    }
  }
  openModal(): void {
    this.isModalOpen = true;
    this.resetForm();
  }
  
  closeModal(): void {
    this.isModalOpen = false;
    this.resetForm();
  }
  
  resetForm(): void {
    this.step = 1;
    this.errorMessage = '';
    this.successMessage = '';
    this.passwordForm.reset();
  }
  
  toggleShowCurrentPassword(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }
  
  toggleShowNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }
  
  toggleShowConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('nouveau_mot_passe')?.value;
    const confirmPassword = form.get('confirmation_mot_passe')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  
   // Méthode pour vérifier le mot de passe actuel avant de passer à l'étape suivante
verifyCurrentPassword(): void {
  this.errorMessage = ''; // Réinitialiser l'erreur
  
  const ancienMotPasse = this.passwordForm.get('ancien_mot_passe')?.value;
  console.log('Mot de passe actuel:', ancienMotPasse); // Déboguer la valeur
  
  if (ancienMotPasse) {
    // Appeler le service AuthService pour vérifier l'ancien mot de passe
    this.authService.verifyOldPassword(ancienMotPasse)
      .then((response: { message: string }) => {  // Spécifier le type de la réponse
        console.log('Réponse du serveur:', response); // Déboguer la réponse
        if (response.message === 'Ancien mot de passe correct') {
          this.step = 2;
        } else {
          this.errorMessage = 'Ancien mot de passe incorrect';
        }
      })
      .catch((error: any) => {  // Typage de l'erreur
        console.log('Erreur lors de la vérification du mot de passe:', error); // Déboguer l'erreur
        this.errorMessage = 'Ancien mot de passe incorrect';
      });
  }
}

changePassword(): void {
  if (this.passwordForm.invalid) {
    return;
  }
  
  const passwordData = this.passwordForm.value;
  
  this.authService.changePassword(passwordData)
    .then((response) => {
      this.successMessage = response.message || 'Mot de passe mis à jour avec succès. Veuillez vous reconnecter.';
      setTimeout(() => {
        this.closeModal();
        this.authService.logout()
          .then(() => {
            this.router.navigate(['/logi']);
          })
          .catch(() => {
            // Even if logout fails on server, clear local storage and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.router.navigate(['/logi']);
          });
      }, 2000);
    })
    .catch((error) => {
      this.step = 1; // Go back to first step
      this.errorMessage = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
    });
}

getFormControl(name: string): FormControl {
  return this.passwordForm.get(name) as FormControl;
}
}
