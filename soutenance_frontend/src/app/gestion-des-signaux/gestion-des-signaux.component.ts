import { Component } from '@angular/core';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';
import {  OnInit } from '@angular/core';
import { SignalService } from '../serviceSignal/signal.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ModalDetailSignalComponent } from '../modal-detail-signal/modal-detail-signal.component';
@Component({
  selector: 'app-gestion-des-signaux',
  imports: [SidebarreComponent,CommonModule,FormsModule, ModalDetailSignalComponent],
  templateUrl: './gestion-des-signaux.component.html',
  styleUrl: './gestion-des-signaux.component.css'
})
export class GestionDesSignauxComponent  implements OnInit {
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

  constructor(private signalService: SignalService) {}
  
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
        alerte.adresse.toLowerCase().includes(this.searchQuery.toLowerCase())
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
}
