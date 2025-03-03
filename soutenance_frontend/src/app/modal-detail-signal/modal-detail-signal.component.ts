
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SignalService, User } from '../serviceSignal/signal.service';
@Component({
  selector: 'app-modal-detail-signal',
  imports: [CommonModule,FormsModule ],
  templateUrl: './modal-detail-signal.component.html',
  styleUrl: './modal-detail-signal.component.css'
})
export class ModalDetailSignalComponent {
  @Input() alerteId: string | null = null;
  @Output() closeModal = new EventEmitter<void>();
 
  alerte: any = null;
  videurs: any[] = [];
  selectedVideur: string | null = null;
  expandedPhotoUrl: string | null = null;

  constructor(private signalService: SignalService) {}

  ngOnInit(): void {
    this.loadAlertDetails();
    this.loadVideurs();
  }

  ngOnChanges(): void {
    if (this.alerteId) {
      this.loadAlertDetails();
    }
  }

  loadAlertDetails(): void {
    if (!this.alerteId) return;
    
    this.signalService.getAlerteById(this.alerteId).then(response => {
      this.alerte = response.data;
    }).catch(error => {
      console.error('Erreur lors de la récupération des détails de l\'alerte:', error);
    });
  }

  loadVideurs(): void {
    this.signalService.getVideurs().then(response => {
      // Filtrer les utilisateurs ayant le rôle 'videur' et statut 'active'
      this.videurs = response.data.filter((user: User) => user.role === 'videur' && user.statut === 'active');
    }).catch(error => {
      console.error('Erreur lors de la récupération des videurs:', error);
    });
  }


  openInMaps(): void {
    if (this.alerte?.coordonnees) {
      const { latitude, longitude } = this.alerte.coordonnees;
      const mapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;
      window.open(mapsUrl, '_blank');
    }
  }

  expandPhoto(url: string): void {
    this.expandedPhotoUrl = url;
  }

  assignerVideur(): void {
    if (!this.selectedVideur || !this.alerteId) return;
    
    this.signalService.assignerVideur(this.alerteId, this.selectedVideur).then(response => {
      alert('Mission envoyée avec succès!');
      this.close();
    }).catch(error => {
      console.error('Erreur lors de l\'assignation du videur:', error);
      alert('Erreur lors de l\'envoi de la mission. Veuillez réessayer.');
    });
  }

  close(): void {
    this.closeModal.emit();
  }
}
