
import { GestionpersonnelService, User } from '../gestionpersonnel-services/gestionpersonnel.service';
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
  photo?: string;
  selectedFile: File | null = null;

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
      this.photo = URL.createObjectURL(this.selectedFile); // Afficher un aperçu de la photo
    }
  }

  onSubmit(): void {
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
      // Si un fichier est sélectionné, utiliser updateUserWithFile
      this.GestionpersonnelService.updateUserWithFile(updatedUser, this.selectedFile).subscribe({
        next: () => {
          this.userModified.emit();  // Émettre l'événement pour informer le parent de la modification
          this.closeModal.emit();
        },
        error: (error) => {
          alert('Erreur lors de la mise à jour de l\'utilisateur : ' + error.message);
        }
      });
    } else {
      // Sinon, utiliser updateUser
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

  close() {
    this.closeModal.emit();
  }
}
