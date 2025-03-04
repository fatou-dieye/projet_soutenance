import { Component } from '@angular/core';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';
import { AlertPoubelleService, User } from '../services-alert-poubelle/alert-poubelle.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { NgxPaginationModule } from 'ngx-pagination';
@Component({
  selector: 'app-alerte-poubelle',
  imports: [SidebarreComponent, CommonModule, FormsModule, NgxPaginationModule ],
  templateUrl: './alerte-poubelle.component.html',
  styleUrl: './alerte-poubelle.component.css'
})
export class AlertePoubelleComponent {
  alerts: any[] = [];
  gardiens: any[] = [];
  isAddAlertModalOpen = false;
  videurs: User[] = [];
  newDepot = { lieu: '', latitude: 0, longitude: 0, gardien_id: '' };
  currentPage = 1; // Page actuelle
  itemsPerPage = 7; // Nombre d'éléments par page
  totalPages = 1; // Nombre total de pages
  
  searchText = ''; // Texte de recherche
  filteredAlerts: any[] = [];
  isTraiterAlertModalOpen = false;
  
  
  // Pour le modal de traitement
  selectedAlert: any = null;
  selectedVideur: string = '';
 
  constructor(private alertService: AlertPoubelleService) {}

  ngOnInit(): void {
    this.loadAlerts();
    this.loadGardiens();
    this.loadVideurs();
    this.calculateTotalPages();
   
  }
  loadAlerts() {
    this.alertService.getAlerts().subscribe(
      (alerts) => {
        this.alerts = alerts;
        this.filteredAlerts = alerts; // Initialiser filteredAlerts avec toutes les alertes
      this.calculateTotalPages(); // Recalculer le nombre total de pages
       
      },
      (error) => {
        console.error('Erreur lors de la récupération des alertes', error);
      }
    );
   
  }
  loadVideurs(): void {
    this.alertService.getVideurs().subscribe(
      (videurs) => {
        this.videurs = videurs; // Stocke les videurs récupérés dans la variable
      },
      (error) => {
        console.error('Erreur lors de la récupération des videurs', error);
      }
    );
  }

   // Fonction pour filtrer la recherche
   filterAlerts() {
    console.log('Search Text:', this.searchText); // Afficher la valeur de searchText
    console.log('Alerts:', this.alerts); // Afficher toutes les alertes
  
    if (!this.searchText) {
      // Si aucun texte n'est entré, on réinitialise filteredAlerts à toutes les alertes.
      this.filteredAlerts = [...this.alerts];
    } else {
      // Filtrer les alertes selon la recherche
      this.filteredAlerts = this.alerts.filter(alert =>
        (alert.depot_id?.lieu?.toLowerCase().includes(this.searchText.toLowerCase())) ||
        (alert.niveau?.toString().includes(this.searchText)) ||
        (alert.date?.toLowerCase().includes(this.searchText.toLowerCase())) ||
        (alert.status?.toLowerCase().includes(this.searchText.toLowerCase()))
      );
    }
  
    // Vérifie que les alertes sont bien filtrées
    console.log('Filtered Alerts:', this.filteredAlerts); // Afficher les alertes filtrées
  
    // Recalculer les pages après le filtrage
    this.calculateTotalPages();
    
    // Réinitialiser à la première page
    this.currentPage = 1;
  }
  



  // Ouvrir le modal pour ajouter une alerte
  openAddAlertModal() {
    this.isAddAlertModalOpen = true;
  }

  // Fermer le modal
  closeAddAlertModal() {
    this.isAddAlertModalOpen = false;
  }
  loadGardiens() {
    this.alertService.getGardiens().subscribe(
      (gardiens) => {
        this.gardiens = gardiens;
      },
      (error) => {
        console.error('Erreur lors de la récupération des gardiens', error);
      }
    );
  }

 
  submitNewDepot() {
    this.alertService.addDepot(this.newDepot).then(response => {
      console.log('Dépôt ajouté avec succès', response);
      this.closeAddAlertModal();
      this.newDepot = { lieu: '', latitude: 0, longitude: 0, gardien_id: '' };
    }).catch(error => {
      console.error('Erreur lors de l\'ajout du dépôt', error);
    });
  }

  // Ouvrir le modal pour traiter une alerte
  openTraiterAlertModal(alert: any) {
    this.selectedAlert = alert;
    this.isTraiterAlertModalOpen = true;
  }
  
  // Fermer le modal de traitement
  closeTraiterAlertModal() {
    this.isTraiterAlertModalOpen = false;
    this.selectedAlert = null;
    this.selectedVideur = '';
  }
  
  
  
  // Assigner l'alerte à un videur
  assignerAVideur() {
    if (!this.selectedVideur || !this.selectedAlert) {
      console.error('Veuillez sélectionner un videur');
      return;
    }
    
    const videurSelectionne = this.videurs.find(v => v._id === this.selectedVideur);
    
    if (!videurSelectionne) {
      console.error('Videur non trouvé');
      return;
    }
    
    // Mettre à jour l'alerte et envoyer l'email
    this.alertService.updateAlert(this.selectedAlert._id, {
      status: 'en traitement',
      employee_email: videurSelectionne.email
    }).subscribe(
      (response) => {
        console.log('Alerte assignée avec succès', response);
        this.closeTraiterAlertModal();
        this.loadAlerts(); // Recharger la liste des alertes
      },
      (error) => {
        console.error('Erreur lors de l\'assignation de l\'alerte', error);
      }
    );
  }


  calculateTotalPages() {
    // Si il y a des alertes filtrées, on calcule le nombre de pages avec filteredAlerts
    this.totalPages = Math.ceil(this.filteredAlerts.length / this.itemsPerPage);
  }
  
  
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
}
}
