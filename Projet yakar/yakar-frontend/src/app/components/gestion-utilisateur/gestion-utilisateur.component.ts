//gestion utilisateur page
import { Component, OnInit } from '@angular/core';
import { UtilisateurService } from '../../utilisateur.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalUtilisateurComponent } from '../modal-utilisateur/modal-utilisateur.component';
import { ModalModificationComponent } from '../modal-modification/modal-modification.component';

interface Utilisateur {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  matricule: string;
  role: 'administrateur' | 'utilisateur';
  dateCreation: Date;
}

@Component({
  selector: 'app-gestion-utilisateur',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalUtilisateurComponent,
    ModalModificationComponent
  ],
  templateUrl: './gestion-utilisateur.component.html',
  styleUrls: ['./gestion-utilisateur.component.scss']
})
export class GestionUtilisateurComponent implements OnInit {
  utilisateurs: Utilisateur[] = [];
  paginatedUtilisateurs: Utilisateur[] = [];
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 0;
  adminCount = 0;
  userCount = 0;
  searchText = '';
  showConfirmationModal = false;
  showDeleteConfirmModal = false;
  showAddModal = false;
  showEditModal = false;
  selectedUserId: string | null = null;
  userToChangeRole: Utilisateur | null = null;
  successMessage: string | null = null;
  loading = false;
  error: string | null = null;

  constructor(private utilisateurService: UtilisateurService) {}

  ngOnInit() {
    this.loadUtilisateurs();
  }
//methode pour recuperer les utilisateur
  loadUtilisateurs() {
    this.loading = true;
    this.error = null;
    this.utilisateurService.getAllUtilisateurs().subscribe({
      next: (response) => {
        if (response.success) {
          this.utilisateurs = response.utilisateurs;
          this.updateStats();
          this.updatePagination();
        } else {
          this.error = 'Erreur lors du chargement des utilisateurs';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.error = error.message || 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
      }
    });
  }
//mise a jours des role administrateur et utilisateur
  updateStats() {
    this.adminCount = this.utilisateurs.filter(u => u.role === 'administrateur').length;
    this.userCount = this.utilisateurs.filter(u => u.role === 'utilisateur').length;
  }
//mise a jour des pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.utilisateurs.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUtilisateurs = this.utilisateurs.slice(startIndex, endIndex);
  }
//recherche utilisateur par son prenom matricule
  onSearch(event: Event) {
    this.loading = true;
    const searchTerm = (event.target as HTMLInputElement).value;
    
    if (!searchTerm.trim()) {
      this.loadUtilisateurs();
      return;
    }

    this.utilisateurService.rechercherUtilisateurs(searchTerm).subscribe({
      next: (response) => {
        if (response.success) {
          this.utilisateurs = response.utilisateurs;
          this.currentPage = 1;
          this.updateStats();
          this.updatePagination();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.loading = false;
      }
    });
  }
//methode pour changement de role
  toggleRole(user: Utilisateur) {
    this.userToChangeRole = user;
    this.showConfirmationModal = true;
  }
//confirmation de changement de role
  confirmRoleChange() {
    if (!this.userToChangeRole) return;

    const newRole = this.userToChangeRole.role === 'administrateur' ? 'utilisateur' : 'administrateur';
    
    this.utilisateurService.updateUtilisateur(this.userToChangeRole._id, { role: newRole }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showConfirmationModal = false;
          this.loadUtilisateurs();
          this.showSuccessMessage('Rôle modifié avec succès');
        }
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.error = error.message || 'Erreur lors de la modification du rôle';
      }
    });
  }
//supprimer un utilisateur par son id
  deleteUser(id: string) {
    const user = this.utilisateurs.find(u => u._id === id);
    if (user) {
      this.userToChangeRole = user;
      this.showDeleteConfirmModal = true;
    }
  }
//confirmation de supression
  confirmDeleteUser() {
    if (!this.userToChangeRole?._id) return;

    this.utilisateurService.deleteUtilisateur(this.userToChangeRole._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showDeleteConfirmModal = false;
          this.loadUtilisateurs();
          this.showSuccessMessage('Utilisateur supprimé avec succès');
        }
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.error = error.message || 'Erreur lors de la suppression';
      }
    });
  }
//la methode qui ouvre le modal de modification
  editUser(id: string) {
    this.selectedUserId = id;
    this.showEditModal = true;
   
  }

  private showSuccessMessage(message: string) {
    this.successMessage = message;
    setTimeout(() => this.successMessage = null, 3000);
  }

  // Méthodes Modal ajouter
  openAddModal() {
    this.showAddModal = true;
   
  }
//fermuture modal ajouter
  closeAddModal() {
    this.showAddModal = false;
    this.loadUtilisateurs();
    this.showSuccessMessage('Utilisateur ajoutée avec succès');
  }
//fermuture modal modifier
  closeEditModal() {
    this.showEditModal = false;
    this.selectedUserId = null;
    this.loadUtilisateurs();
    
  }
//fermuture de modal de changement de role
  closeConfirmationModal() {
    this.showConfirmationModal = false;
    this.userToChangeRole = null;
  }
//fermuture de modal suprimer
  closeDeleteConfirmModal() {
    this.showDeleteConfirmModal = false;
    this.userToChangeRole = null;
  }
//chagement de page pagination
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }
//les message de succes apres chaque action
  handleSuccess(message: string) {
    this.showSuccessMessage(message);
    this.loadUtilisateurs();
  }
}