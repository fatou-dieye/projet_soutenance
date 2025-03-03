import { Component } from '@angular/core';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';
import { AlertPoubelleService } from '../services-alert-poubelle/alert-poubelle.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
@Component({
  selector: 'app-alerte-poubelle',
  imports: [SidebarreComponent, CommonModule],
  templateUrl: './alerte-poubelle.component.html',
  styleUrl: './alerte-poubelle.component.css'
})
export class AlertePoubelleComponent {
  alerts: any[] = [];

  constructor(private alertService: AlertPoubelleService) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts() {
    this.alertService.getAlerts().then(response => {
      this.alerts = response.data;
    }).catch(error => {
      console.error('Erreur lors de la récupération des alertes', error);
    });
  }
}
