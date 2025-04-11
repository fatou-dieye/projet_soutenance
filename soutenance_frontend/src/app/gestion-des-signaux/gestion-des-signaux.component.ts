import { Component } from '@angular/core';
import {  OnInit } from '@angular/core';
import { SignalService } from '../services/serviceSignal/signal.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ModalDetailSignalComponent } from '../modal-detail-signal/modal-detail-signal.component';
import { MessageSuccesComponent } from '../message-succes/message-succes.component';

import { NiveauPoubelleService } from '../services/servicesSensor/niveau-poubelle.service';
import { AlertPoubelleService } from '../services/services-alert-poubelle/alert-poubelle.service';
import { AlertModalComponent } from '../alertemodale/alertemodale.component';
@Component({
  providers: [ AlertPoubelleService,
    NiveauPoubelleService],
  selector: 'app-gestion-des-signaux',
  imports: [CommonModule,FormsModule, ModalDetailSignalComponent, MessageSuccesComponent, AlertModalComponent],
  templateUrl: './gestion-des-signaux.component.html',
  styleUrl: './gestion-des-signaux.component.css'
})
export class GestionDesSignauxComponent  implements OnInit {
  showSuccessModal: boolean = false;
  successModalMessage: string = '';
  alertes: any[] = [];
  paginatedAlertes: any[] = [];
  selectedAlerteId: string | null = null;
  searchQuery: string = '';
  currentPage: number = 1;
  totalPages: number = 0;
  itemsPerPage: number = 7;
  pages: number[] = [];
 
  filteredAlertes: any[] = [];
  selectedDate: string | null = null;

  constructor(private signalService: SignalService,
    private alertModalService:AlertPoubelleService 

  ) {}
  
  ngOnInit(): void {
    this.loadAlertes();
  }
  
  loadAlertes(): void {
    this.signalService.getAlertes().then(response => {
      this.alertes = response.data.alertes;
      this.paginateAlertes();
      this.filterAlertesByDate();
    }).catch(error => {
      console.error('Erreur lors de la récupération des alertes:', error);
    });
  }
  
  testAlertModal() {
    console.log('Test: Affichage de la modale');
    this.alertModalService.showModal('Ceci est un test de modale d\'alerte', 95);
  }
  

  filterAlertesByDate(): void {
    if (this.selectedDate) {
      const selectedDateObj = new Date(this.selectedDate);
      this.filteredAlertes = this.alertes.filter(alerte => {
        const alerteDate = new Date(alerte.dateCreation);
        return alerteDate.toDateString() === selectedDateObj.toDateString();
      });
    } else {
      this.filteredAlertes = this.alertes;
    }
    this.paginateAlertes(); // Recalculer la pagination après le filtrage
  }

  paginateAlertes(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedAlertes = this.filteredAlertes.slice(startIndex, startIndex + this.itemsPerPage);
    this.totalPages = Math.ceil(this.filteredAlertes.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateAlertes();
    }
  }


  onSearch(): void {
    if (this.searchQuery) {
      this.filteredAlertes = this.alertes.filter(alerte =>
        alerte.adresse.toLowerCase().includes(this.searchQuery.toLowerCase())||
        alerte.statut.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
      this.paginateAlertes();
    } else {
      this.filterAlertesByDate(); // Appliquer le filtrage par date
    }
  }

  
  viewDetails(alerteId: string): void {
    this.selectedAlerteId = alerteId;
  }
  
  closeDetailModal(): void {
    this.selectedAlerteId = null;
    this.loadAlertes(); // Refresh data in case assignment was made
  }
  onMissionEnvoyee(message: string): void {
    // Affiche le modal de succès
    this.openSuccessModal('Mission envoyer avec succes');
  }

  // Méthode pour ouvrir le modal avec un message spécifique
  openSuccessModal(message: string): void {
    this.successModalMessage = message;
    this.showSuccessModal = true;

    // Fermer le modal après un délai (ex. 2 secondes)
    setTimeout(() => {
      this.closeSuccessModal();
    }, 10000); // 2 secondes
  }

  // Fermer le modal de succès
  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

}
