import { Component, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UtilisateurService } from '../services/utilisateur.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { SidebarreComponent } from '../sidebarre/sidebarre.component';

@Component({
  selector: 'app-gestion-des-signaux',
  standalone: true,
  imports: [SidebarreComponent, FormsModule, CommonModule],
  templateUrl: './gestion-des-signaux.component.html',
  styleUrl: './gestion-des-signaux.component.css'
})
export class GestionDesSignauxComponent implements AfterViewInit {
  currentStep: number = 1;
  latitude: number = 0;
  longitude: number = 0;
  photos: File[] = [];
  description = '';
  map: any;
  userLocation: any;
  L: any; // Stocker Leaflet après l'importation dynamique

  constructor(
    private utilisateurService: UtilisateurService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const leaflet = await import('leaflet');
        this.L = leaflet;
        this.initMap();
      } catch (error) {
        console.error('Erreur lors du chargement de Leaflet:', error);
      }
    }
  }

  initMap() {
    if (!this.L || !document.getElementById('map')) {
      console.error("L'élément 'map' est introuvable ou Leaflet n'est pas chargé.");
      return;
    }

    this.map = this.L.map('map').setView([51.505, -0.09], 13);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  shareLocation() {
    if (navigator.geolocation && this.map) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        console.log('Latitude:', this.latitude, 'Longitude:', this.longitude);
        this.userLocation = [this.latitude, this.longitude];
        this.map.setView(this.userLocation, 13);
        this.L.marker(this.userLocation).addTo(this.map);
      }, (error) => {
        console.error('Erreur lors de la récupération de la localisation :', error);
      });
    } else {
      console.warn("La géolocalisation n'est pas supportée ou la carte n'est pas initialisée.");
    }
  }
  

  onFileChange(event: any) {
    this.photos = Array.from(event.target.files);
  }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
      this.updateProgress();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgress();
    }
  }

  updateProgress() {
    const progress = (this.currentStep - 1) * 50; // 0%, 50%, 100%
    const progressBar = document.querySelector('.progress-line') as HTMLElement;

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  finishStep() {
    const alerte = {
      description: this.description,
      adresse: `Latitude: ${this.latitude}, Longitude: ${this.longitude}`,
      latitude: this.latitude,
      longitude: this.longitude,
      photos: this.photos
    };

    this.utilisateurService.createAlerte(alerte)
      .then(response => {
        alert(response.message);
      })
      .catch(error => {
        alert(`Erreur: ${error.message}`);
      });
  }
}
