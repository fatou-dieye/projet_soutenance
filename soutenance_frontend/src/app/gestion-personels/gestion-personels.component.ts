
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';
import { AjouterPersonnelsComponent } from '../ajouter-personnels/ajouter-personnels.component';
import { FormsModule } from '@angular/forms';
import { GestionpersonnelService, User } from '../services/gestionpersonnel-services/gestionpersonnel.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/serviceslogin/auth.service';
import { ModifierPersonnelsComponent } from '../modifier-personnels/modifier-personnels.component';

@Component({
  selector: 'app-gestion-personels',
  imports: [SidebarreComponent, CommonModule,FormsModule,AjouterPersonnelsComponent,ModifierPersonnelsComponent],
  templateUrl: './gestion-personels.component.html',
  styleUrl: './gestion-personels.component.css'
})
export class GestionPersonelsComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;
  currentUser: any;
  showAddPersonnelModal: boolean = false; // Variable spécifique au modal d'ajout de personnel
   showModifyPersonnelModal = false;  // Variable pour afficher ou fermer le modal de modification

  // Variables pour le Success Modal
  showSuccessModal = false;  // Spécifique à ce modal
  successModalMessage = '';  // Message du modal spécifique

 
  // ✅ Variables pour le modal
  showModal = false;
  modalMessage = '';
  actionType: string = '';
  selectedUser!: User;
  selectedUserIds: string[] = []; 
  constructor(
    private GestionpersonnelService: GestionpersonnelService, 
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngAfterViewInit() {
    console.log("Modal ajouté au DOM :", this.showAddPersonnelModal);
  }
  
  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/logi']);
      return;
    }
    
    // Get current user
    this.currentUser = this.authService.getCurrentUser();
    
    // Check if user has required role
    if (this.currentUser && this.currentUser.role === 'administrateur') {
      this.loadUsers();
    } else {
      // Redirect if not admin
      this.router.navigate(['/unauthorized']);
    }
  }
  
  loadUsers(): void {
    this.GestionpersonnelService.getAllUsers().subscribe({
      next: (data) => {
        // Filter users by roles: administrateur, gardient, videur
        this.users = data.filter(user => 
          ['administrateur', 'gardient', 'videur'].includes(user.role)
        );
        this.filteredUsers = [...this.users];
        this.calculatePages();
     
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        
        // If unauthorized, token might be expired or invalid
        if (error.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.router.navigate(['/logi']);
        }
      }
    });
  }
  onUserAdded() {
    // Recharge la liste des utilisateurs après un ajout
    this.loadUsers();
    this.openSuccessModal(' Utilisatur Ajouter  avec succès !');
  }

  onUserModified() {
    // Recharge la liste des utilisateurs après une modification
    this.loadUsers();
    this.openSuccessModal(' Utilisatur Modifier  avec succès !');
  }
  //ouvrire modal ajouter personnels
  ouvrirModalAjoutPersonnel() {
    console.log("Bouton cliqué, ouverture du modal");
    this.showAddPersonnelModal = true;
    console.log("showAddPersonnelModal mis à jour :", this.showAddPersonnelModal);
  }
//fermer modal ajouter personnel
  fermerModalAjoutPersonnel() {
    console.log("Fermeture du modal demandée");
    this.showAddPersonnelModal = false;
    console.log("showAddPersonnelModal mis à jour :", this.showAddPersonnelModal);
   
   
  }

   // ouvre le modalLorsque le bouton "Modifier" est cliqué 
   openModifyModal(user: User): void {
    this.selectedUser = user;
    this.showModifyPersonnelModal = true;
  }

  // Fermer le modal de modification
  closeModifyModal(): void {
    this.showModifyPersonnelModal = false;
 
  }

     // Ouvrir le modal de succès avec un message spécifique
  openSuccessModal(message: string): void {
    this.successModalMessage = message;
    this.showSuccessModal = true;

    // Fermer le modal après 10 secondes
    setTimeout(() => {
      this.closeSuccessModal();
    }, 2000); // 10 secondes
  }

  // Fermer le modal de succès
  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }



  
  // ✅ Ouvrir le modal avec le bon message et action
  openConfirmModal(user: User, action: string): void {
    this.selectedUser = user;
    this.actionType = action;

    if (action === 'delete') {
      this.modalMessage = `Voulez-vous vraiment supprimer ${user.prenom} ${user.nom} ?`;
    } else if (action === 'status') {
      this.modalMessage = user.statut === 'active' 
        ? `Voulez-vous bloquer ${user.prenom} ${user.nom} ?`
        : `Voulez-vous activer ${user.prenom} ${user.nom} ?`;
    }

    this.showModal = true;
  }

  // ✅ Fermer le modal
  closeModal(): void {
    this.showModal = false;
  }

  
//supprimer un utilisateur
  deleteUser(): void {
    this.GestionpersonnelService.deleteUser(this.selectedUser._id).subscribe({
      next: () => {
        this.openSuccessModal(' Utilisatur supprimer  avec succès !');
        this.loadUsers()},
      
      error: (error) => {
        if (error.status === 401) this.router.navigate(['/logi']);
      }
    });
  }
//bloquer ou debloquer un utilisateur
  toggleStatus(): void {
    this.GestionpersonnelService.toggleUserStatus(this.selectedUser._id).subscribe({
      next: (response) => {
        this.selectedUser.statut = response.user.statut;
        const actionMessage = this.selectedUser.statut === 'active'
        ? 'Utilisateur débloqué avec succès !'
        : 'Utilisateur bloqué avec succès !';
      this.openSuccessModal(actionMessage);
      },
      error: (error) => {
        if (error.status === 401) this.router.navigate(['/logi']);
      }
    });
  }
  toggleSelection(userId: string): void {
    const index = this.selectedUserIds.indexOf(userId);
    if (index > -1) {
      this.selectedUserIds.splice(index, 1); // Déselectionner
    } else {
      this.selectedUserIds.push(userId); // Sélectionner
    }
  }

  selectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedUserIds = this.users.map(user => user._id); // Sélectionner tous
    } else {
      this.selectedUserIds = []; // Désélectionner tous
    }
  }

  isSelected(userId: string): boolean {
    return this.selectedUserIds.includes(userId);
  }
//supprimer mutmiple
  deleteMultipleUsers(): void {
    if (this.selectedUserIds.length === 0) {
      alert("Veuillez sélectionner au moins un utilisateur.");
      return;
    }
  
    // Trouver les utilisateurs sélectionnés en utilisant leurs IDs
    const selectedUsers = this.users.filter(user => this.selectedUserIds.includes(user._id));
  
    // Créer un message avec les noms des utilisateurs sélectionnés
    const userNames = selectedUsers.map(user => `${user.prenom} ${user.nom}`).join(', ');
  
    // Mettre à jour le message du modal
    this.modalMessage = `Êtes-vous sûr de vouloir supprimer ces utilisateurs ? (${this.selectedUserIds.length} utilisateurs sélectionnés)\n\n${userNames}`;
  
    // Définir le type d'action pour la suppression multiple
    this.actionType = 'bulkDelete';
  
    // Afficher le modal
    this.showModal = true;
  }
   // Méthode de confirmation (sera appelée quand l'utilisateur confirme l'action dans le modal)
   confirmAction(): void {
    if (this.actionType === 'bulkDelete') {
      this.bulkDeleteUsers();
    } else if (this.actionType === 'bulkBlock') {
      this.updateMultipleUserStatus('bloquer');// Passer 'bloquer' pour bloquer les utilisateurs
      this.openSuccessModal(`${this.selectedUserIds.length} utilisateurs Bloquer avec succès !`);
    } else if (this.actionType === 'bulkUnblock') {
      this.updateMultipleUserStatus('active'); // Passer 'active' pour débloquer les utilisateurs
      this.openSuccessModal(`${this.selectedUserIds.length} utilisateurs Debloquer avec succès !`);
    } else if (this.actionType === 'delete') {
      // Si l'action est une suppression unique
      this.deleteUser();
    } else if (this.actionType === 'status') {
      // Si l'action est un changement de statut unique (blocage ou déblocage)
      this.toggleStatus();
    }
    
    // Ferme le modal après l'action
    this.closeModal();
}


  // Nouvelle méthode pour la suppression multiple
  bulkDeleteUsers(): void {
    this.GestionpersonnelService.bulkDeleteUsers(this.selectedUserIds).subscribe(
      (response) => {
      
        this.selectedUserIds = []; // Réinitialiser la sélection
        this.openSuccessModal(`${this.selectedUserIds.length} utilisateurs supprimés avec succès !`);

        this.loadUsers(); // Recharger la liste après suppression
      },
      (error) => {
        alert("Erreur lors de la suppression : " + error.error.message);
      }
    );
  }
// Nouvelle méthode pour bloquer plusieurs utilisateurs
blockMultipleUsers(): void {
  if (this.selectedUserIds.length === 0) {
    alert('Veuillez sélectionner au moins un utilisateur.');
    return;
  }

  // Récupérer les utilisateurs sélectionnés
  this.GestionpersonnelService.getAllUsers().subscribe(
    (users) => {
      const selectedUsers = users.filter(user => this.selectedUserIds.includes(user._id));
      const selectedUserNames = selectedUsers.map(user => user.nom + ' ' + user.prenom).join(', ');

      // Afficher le message avec les noms des utilisateurs
      this.modalMessage = `Êtes-vous sûr de vouloir bloquer ces ${this.selectedUserIds.length} utilisateurs ? \n\nUtilisateurs : ${selectedUserNames}`;
      this.actionType = 'bulkBlock';
      this.showModal = true;
    },
    (error) => {
      alert('Erreur lors de la récupération des utilisateurs : ' + error.error.message);
    }
  );
}

// Nouvelle méthode pour débloquer plusieurs utilisateurs
unblockMultipleUsers(): void {
  if (this.selectedUserIds.length === 0) {
    alert('Veuillez sélectionner au moins un utilisateur.');
    return;
  }

  // Récupérer les utilisateurs sélectionnés
  this.GestionpersonnelService.getAllUsers().subscribe(
    (users) => {
      const selectedUsers = users.filter(user => this.selectedUserIds.includes(user._id));
      const selectedUserNames = selectedUsers.map(user => user.nom + ' ' + user.prenom).join(', ');

      // Afficher le message avec les noms des utilisateurs
      this.modalMessage = `Êtes-vous sûr de vouloir débloquer ces ${this.selectedUserIds.length} utilisateurs ? \n\nUtilisateurs : ${selectedUserNames}`;
      this.actionType = 'bulkUnblock';
      this.showModal = true;
    },
    (error) => {
      alert('Erreur lors de la récupération des utilisateurs : ' + error.error.message);
    }
  );
}

// Mettre à jour le statut des utilisateurs (bloquer/débloquer)
updateMultipleUserStatus(statut: string): void {
  this.GestionpersonnelService.updateUsersStatus(this.selectedUserIds, statut).subscribe({
    next: (response) => {
      this.selectedUserIds = []; // Réinitialiser la sélection
      this.loadUsers(); // Recharger les utilisateurs après la mise à jour
     
    },
    error: (error) => {
      alert('Erreur lors de la mise à jour des utilisateurs : ' + error.error.message);
    }
  });
}

  searchUsers(event: Event): void {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    
    if (value) {
      this.filteredUsers = this.users.filter(user => 
        user.nom.toLowerCase().includes(value) || 
        user.prenom.toLowerCase().includes(value) || 
        user.email.toLowerCase().includes(value) ||
        user.telephone.includes(value)||
        user.role.toLowerCase().includes(value) ||
        user.statut.toLowerCase().includes(value) 
      );
    } else {
      this.filteredUsers = [...this.users];
    }
    
    this.currentPage = 1;
    this.calculatePages();
  }
  //pagination

  calculatePages(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
  }
  
  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
}
