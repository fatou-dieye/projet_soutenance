import { Component, OnInit} from '@angular/core';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';
import { AlertService } from '../alert.service';
import { AuthService } from '../services/auth.service';
@Component({
  selector: 'app-dasbordadmin',
  imports: [],
  templateUrl: './dasbordadmin.component.html',
  styleUrl: './dasbordadmin.component.css'
})
export class DasbordadminComponent  implements OnInit {
  alerts: any[] = [];
  selectedAlert: any = null;
  selectedDriver: string = '';
  position: { latitude: number, longitude: number } | null = null;
  drivers = [
    { id: 1, name: 'Mamadou Diallo', available: true },
    { id: 2, name: 'Ibrahima Sow', available: true },
    { id: 3, name: 'Fatou Ndiaye', available: false }
  ];

  constructor(private alertService: AlertService,
    public authService: AuthService

  ) {}

 

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Déconnexion réussie');
      },
      error: (error) => {
        console.error('Erreur lors de la déconnexion', error);
      }
    });
  }


  ngOnInit() {
    this.loadAlerts();
  }

  loadAlerts() {
    this.alertService.getAlerts().subscribe(data => {
      this.alerts = data;
    });
  }

  selectAlert(alert: any) {
    this.selectedAlert = alert;
  }

  

  shareLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.position = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        const locationElement = document.getElementById('location');
        if (locationElement) {
          locationElement.innerText = `Latitude: ${this.position.latitude}, Longitude: ${this.position.longitude}`;
        }
      }, () => {
        alert("Impossible d'obtenir la localisation.");
      });
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  }
}