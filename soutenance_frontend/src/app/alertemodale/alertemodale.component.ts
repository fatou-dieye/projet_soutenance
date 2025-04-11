
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NiveauPoubelleService } from '../services/servicesSensor/niveau-poubelle.service';
import { AlertPoubelleService } from '../services/services-alert-poubelle/alert-poubelle.service';
import { CommonModule } from '@angular/common';
@Component({
  
  selector: 'app-alertemodale',
  imports: [CommonModule],
  templateUrl: './alertemodale.component.html',
  styleUrl: './alertemodale.component.css'
})
export class AlertModalComponent implements OnInit, OnDestroy {
  showModal = false;
  message = '';
  niveau?: number;
  
  private modalSubscription!: Subscription;
  private alertSubscription!: Subscription;

  constructor(
    private alertModalService: AlertPoubelleService,
    private niveauPoubelleService: NiveauPoubelleService
  ) {}

  ngOnInit() {
    // S'abonner aux changements d'état de la modale
    this.modalSubscription = this.alertModalService.getAlertModalState()
      .subscribe(data => {
        this.showModal = data.show;
        this.message = data.message;
        this.niveau = data.niveau;
      });

    // S'abonner aux nouvelles alertes
    this.alertSubscription = this.niveauPoubelleService.getNewAlertUpdates()
      .subscribe(data => {
        this.alertModalService.showModal(
          data.message || 'Nouvelle alerte de niveau de poubelle détectée!',
          data.niveau
        );
      });
  }

  ngOnDestroy() {
    // Se désabonner pour éviter les fuites de mémoire
    if (this.modalSubscription) {
      this.modalSubscription.unsubscribe();
    }
    if (this.alertSubscription) {
      this.alertSubscription.unsubscribe();
    }
  }
}
