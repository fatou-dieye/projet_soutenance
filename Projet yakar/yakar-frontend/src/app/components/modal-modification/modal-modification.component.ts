//modal modification  utilisateur
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UtilisateurService } from '../../utilisateur.service';

interface Utilisateur {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  mot_passe?: string;
  code_secret?: string;
}

@Component({
  selector: 'app-modal-modification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-modification.component.html',
  styleUrls: ['./modal-modification.component.scss']
})
export class ModalModificationComponent implements OnInit {
  @Input() userId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<string>();

  utilisateur: Utilisateur = {
    _id: '',
    nom: '',
    prenom: '',
    email: '',
    role: '',
    mot_passe: '',
    code_secret: ''
  };

  originalData: Partial<Utilisateur> = {};
  showPassword = false;
  errorMessage = '';
  isSubmitting = false;
  isLoading = false;

  constructor(private utilisateurService: UtilisateurService) {}

  ngOnInit() {
    if (this.userId) {
      this.loadUserData();
    }
  }

  private loadUserData() {
    this.isLoading = true;
    this.utilisateurService.getUtilisateurById(this.userId).subscribe({
      next: (response) => {
        if (response && response.utilisateur) {
          this.utilisateur = {
            ...response.utilisateur,
            mot_passe: '',
            code_secret: ''
          };
          // Sauvegarder les données originales pour la comparaison
          this.originalData = {
            nom: response.utilisateur.nom,
            prenom: response.utilisateur.prenom,
            email: response.utilisateur.email
          };
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.errorMessage = 'Erreur lors de la récupération des données';
        this.isLoading = false;
      }
    });
  }
//validation des champs
  validateForm(form: NgForm): boolean {
    if (!form.valid) {
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire';
      return false;
    }
    return true;
  }

  onSubmit(form: NgForm) {
    if (!form.valid) return;
  
    this.isSubmitting = true;
    this.errorMessage = '';
  
    // Ne pas envoyer les champs vides
    const updateData: Partial<Utilisateur> = {};
    
    if (this.utilisateur.nom?.trim() !== this.originalData.nom) {
      updateData.nom = this.utilisateur.nom.trim();
    }
    if (this.utilisateur.prenom?.trim() !== this.originalData.prenom) {
      updateData.prenom = this.utilisateur.prenom.trim();
    }
    if (this.utilisateur.email?.trim() !== this.originalData.email) {
      updateData.email = this.utilisateur.email.trim();
    }
    if (this.utilisateur.mot_passe) {
      updateData.mot_passe = this.utilisateur.mot_passe;
    }
    if (this.utilisateur.code_secret) {
      updateData.code_secret = this.utilisateur.code_secret;
    }
  
    // Vérifier s'il y a des modifications
    if (Object.keys(updateData).length === 0) {
      this.errorMessage = 'Aucune modification n\'a été effectuée';
      this.isSubmitting = false;
      return;
    }
  
    this.utilisateurService.updateUtilisateur(this.userId, updateData)
      .subscribe({
        next: (response) => {
          console.log('Mise à jour réussie:', response);
          this.success.emit('Utilisateur modifié avec succès');
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour:', error);
          // Gérer les différents types d'erreurs
          if (error.status === 400) {
            this.errorMessage = error.error.message || 'Données invalides';
          } else if (error.status === 404) {
            this.errorMessage = 'Utilisateur non trouvé';
          } else {
            this.errorMessage = 'Erreur lors de la mise à jour';
          }
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
  }
  //fermer le modal

  closeModal() {
    this.close.emit();
  }
}