import { Component } from '@angular/core';
import { AlertPoubelleService, User } from '../services/services-alert-poubelle/alert-poubelle.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { NgxPaginationModule } from 'ngx-pagination';
import { MessageSuccesComponent } from '../message-succes/message-succes.component';
@Component({
  selector: 'app-alerte-poubelle',
  imports: [CommonModule, FormsModule, NgxPaginationModule,  MessageSuccesComponent ],
  templateUrl: './alerte-poubelle.component.html',
  styleUrl: './alerte-poubelle.component.css'
})
export class AlertePoubelleComponent {
  showSuccessModal: boolean = false;
  successModalMessage: string = '';
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
  addresses: string[] = []; 
  filteredVideurs: User[] = []; 
  selectedAddress: string = '';
  // Pour le modal de traitement
  selectedAlert: any = null;
  selectedVideur: string = '';
 
// Limites de Dakar (approximatives)
dakarLimits = {
  latMin: 14.60,
  latMax: 14.85,
  lngMin: -17.55,
  lngMax: -17.30
};
  
  // Erreurs de validation
  validationErrors = {
    lieu: '',
    latitude: '',
    longitude: '',
    gardien_id: '',
    zone: ''
  };
  selectedZone: string = '';
  filteredGardiens: any[] = [];

  // Indicateur si le formulaire est valide
  isFormValid = false;

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
        this.filteredVideurs = videurs; // Initialiser les videurs filtrés avec tous les videurs
        
        // Extraire les adresses uniques
        this.addresses = Array.from(new Set(this.videurs.map(videur => videur.adresse)));
      },
      (error) => {
        console.error('Erreur lors de la récupération des videurs', error);
      }
    );
  }

 // Méthode pour filtrer les videurs par adresse
 filterVideursByAddress(): void {
  if (!this.selectedAddress) {
    // Si aucune adresse n'est sélectionnée, afficher tous les videurs
    this.filteredVideurs = this.videurs;
  } else {
    // Filtrer les videurs par l'adresse sélectionnée
    this.filteredVideurs = this.videurs.filter(videur => videur.adresse === this.selectedAddress);
  }
  // Réinitialiser le videur sélectionné pour éviter des incohérences
  this.selectedVideur = '';
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

 
  // Validation des coordonnées pour controle de saisi du formulaire ajout depos
  validateCoordinates(): boolean {
    let isValid = true;
    
    // Réinitialiser les erreurs
    this.validationErrors = {
      lieu: '',
      latitude: '',
      longitude: '',
      gardien_id: '',
      zone: ''
    };
    
    // Validation du lieu
    if (!this.newDepot.lieu || this.newDepot.lieu.trim() === '') {
      this.validationErrors.lieu = 'Le lieu est obligatoire';
      isValid = false;
    }
    
    // Validation de la latitude
    if (isNaN(this.newDepot.latitude)) {
      this.validationErrors.latitude = 'La latitude doit être un nombre';
      isValid = false;
    } else if (this.newDepot.latitude < this.dakarLimits.latMin || this.newDepot.latitude > this.dakarLimits.latMax) {
      this.validationErrors.latitude = `La latitude doit être entre ${this.dakarLimits.latMin} et ${this.dakarLimits.latMax} pour Dakar`;
      isValid = false;
    }
    
    // Validation de la longitude
    if (isNaN(this.newDepot.longitude)) {
      this.validationErrors.longitude = 'La longitude doit être un nombre';
      isValid = false;
    } else if (this.newDepot.longitude < this.dakarLimits.lngMin || this.newDepot.longitude > this.dakarLimits.lngMax) {
      this.validationErrors.longitude = `La longitude doit être entre ${this.dakarLimits.lngMin} et ${this.dakarLimits.lngMax} pour Dakar`;
      isValid = false;
    }
    
   
    
    this.isFormValid = isValid;
    return isValid;
  }
  
  // Méthode pour vérifier si les coordonnées sont dans Dakar pendant la saisie
  onCoordinateChange() {
    this.validateCoordinates();
  }
  
  // Méthode pour ouvrir le modal avec un message spécifique
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




  submitNewDepot() {
    if (!this.selectedZone) {
      this.validationErrors.zone = 'Veuillez sélectionner une zone.';
      return;
    }
  
    if (this.validateCoordinates() && this.newDepot.gardien_id) {
      const depotData = {
        lieu: this.newDepot.lieu,
        latitude: this.newDepot.latitude,
        longitude: this.newDepot.longitude,
        gardien_id: this.newDepot.gardien_id
      };
  
      this.alertService.addDepot(depotData).then(response => {
        console.log('Dépôt ajouté avec succès', response);
        this.openSuccessModal('Dépôt ajouté avec succès !');
        this.closeAddAlertModal();
  
        // Réinitialiser les champs
        this.newDepot = { lieu: '', latitude: 0, longitude: 0, gardien_id: '' };
        this.selectedZone = '';
        this.filteredGardiens = [];
        this.validationErrors = { lieu: '', latitude: '', longitude: '', gardien_id: '', zone: '' };
      }).catch(error => {
        console.error('Erreur lors de l\'ajout du dépôt', error);
      });
    }
  }

  onZoneChange() {
    if (this.selectedZone) {
      this.alertService.getAvailableGardiensByZone(this.selectedZone).subscribe(
        (gardiens) => {
          this.filteredGardiens = gardiens;
        },
        (error) => {
          console.error('Erreur lors de la récupération des gardiens disponibles :', error);
          this.filteredGardiens = [];
        }
      );
    } else {
      this.filteredGardiens = [];
    }
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
        this.openSuccessModal('Alerte assignée avec succès!');
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

// Dans votre fichier component.ts
getStatusClass(status: string): string {
  switch (status) {
    case 'traité':
      return 'status-badge status-traite';
    case 'en traitement':
      return 'status-badge status-en-traitement';
    case 'en attente':
    default:
      return 'status-badge status-en-attente';
  }
}
}
