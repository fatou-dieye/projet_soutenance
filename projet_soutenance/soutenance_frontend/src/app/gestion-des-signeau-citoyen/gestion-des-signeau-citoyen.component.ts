import { Component, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UtilisateurService } from '../services/utilisateur.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from '../../safe-url.pipe';
interface Alerte {
  dateCreation: Date;
  adresse: string;
  description?: string;
  coordonnees: {
    latitude: number;
    longitude: number;
  };
  photos?: Photo[];
}

interface Photo {
  chemin: string;
  _id: string;
  dateAjout: Date;
}

@Component({
  selector: 'app-gestion-des-signeau-citoyen',
  imports: [ FormsModule, CommonModule ],
  templateUrl: './gestion-des-signeau-citoyen.component.html',
  styleUrl: './gestion-des-signeau-citoyen.component.css'
})
export class  GestionDesSigneauCitoyenComponent implements AfterViewInit {
  currentStep: number = 1;
  latitude: number = 0;
  longitude: number = 0;
  photos: File[] = [];
  photoUrls: string[] = [];
  description = '';
  map: any;
  userLocation: any;
  L: any;
  errorMessage = '';
  successMessage = '';
  successModalMessage = '';
  showSuccessModal = false;
  showNextButton = false;
  showErrorMessage: boolean = false;

  alertes: Alerte[] = [];
  allAlertes: Alerte[] = [];
  totalAlertes: number = 0;
  currentPage: number = 1;
  totalPages: number = 0;
  limit: number = 3;
  paginationArray: number[] = [];
  selectedAlerte: Alerte | null = null;

  constructor(
    private utilisateurService: UtilisateurService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const leaflet = await import('leaflet');
        this.L = leaflet;
      } catch (error) {
        console.error('Erreur lors du chargement de Leaflet:', error);
      }
    }
    this.fetchAlertes();
  }

  initMap() {
    const mapElement = document.getElementById('map');
    if (!this.L || !mapElement) {
      console.error("L'élément 'map' est introuvable ou Leaflet n'est pas chargé.");
      return;
    }

    this.map = this.L.map(mapElement).setView([51.505, -0.09], 13);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    mapElement.classList.add('show-map');
  }

  shareLocation() {
    if (navigator.geolocation && this.L) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.userLocation = [this.latitude, this.longitude];
        this.initMap();

        this.map.setView(this.userLocation, 13);
        this.L.marker(this.userLocation, {
          icon: this.L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(this.map);

        this.showNextButton = true;

        const shareButton = document.querySelector('.share-location') as HTMLElement;
        const shareText = document.querySelector('.step-header p') as HTMLElement;
        const icon = document.querySelector('.step-header i') as HTMLElement;

        if (shareButton) { shareButton.style.display = 'none'; }
        if (shareText) { shareText.style.display = 'none'; }
        if (icon) { icon.style.display = 'none'; }

        setTimeout(() => {
          this.map.invalidateSize();
        }, 500);

      }, (error) => {
        this.errorMessage = 'Erreur lors de la récupération de la localisation : ' + error.message;
      });
    } else {
      this.errorMessage = "La géolocalisation n'est pas supportée ou la carte n'est pas initialisée.";
    }
  }

  onFileChange(event: any) {
    const files = Array.from(event.target.files) as File[];

    if (files.length <= 4) {
      this.photos = files;
      this.photoUrls = files.map(file => URL.createObjectURL(file));
      this.errorMessage = '';
    } else {
      this.errorMessage = "Vous ne pouvez ajouter que 4 photos maximum.";
    }
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (this.latitude === 0 || this.longitude === 0) {
        this.showErrorMessage = true;
        return;
      }
    } else if (this.currentStep === 2) {
      if (this.photos.length === 0) {
        this.errorMessage = 'Veuillez ajouter au moins une photo pour continuer.';
        return;
      }
    } 
      if (this.currentStep < 3) {
        this.currentStep++;
        this.updateProgress();
      }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgress();
      this.errorMessage = '';
    }
  }
  

  updateProgress() {
    const progress = (this.currentStep - 1) * 33;
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
        this.openSuccessModal(response.message);
        this.updateProgress();

        const progressBar = document.querySelector('.progress-line') as HTMLElement;
        if (progressBar) {
          progressBar.style.width = '100%';
        }

        setTimeout(() => {
          this.resetForm();
          this.currentStep = 1;
          this.updateProgress();
        }, 1500);
      })
      .catch(error => {
        this.errorMessage = `Erreur: ${error.message}`;
      });
  }



  

  openSuccessModal(message: string): void {
    this.successModalMessage = message;
    this.showSuccessModal = true;

    setTimeout(() => {
      this.closeSuccessModal();
    }, 1000);
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  resetForm() {
    this.latitude = 0;
    this.longitude = 0;
    this.photos = [];
    this.photoUrls = [];
    this.description = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.showNextButton = false;

    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.classList.remove('show-map');
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const shareButton = document.querySelector('.share-location') as HTMLElement;
    if (shareButton) {
      shareButton.style.display = 'inline-block';
    }

    const stepHeader = document.querySelector('.step-header p') as HTMLElement;
    if (stepHeader) {
      stepHeader.style.display = 'block';
    }

    const icon = document.querySelector('.step-header i') as HTMLElement;
    if (icon) {
      icon.style.display = 'inline-block';
    }

    this.showErrorMessage = false;
  }
  
  fetchAlertes() {
    this.utilisateurService.getAlertesUtilisateur()
      .then(data => {
        if (data && data.alertes) {
          this.allAlertes = data.alertes;
          this.totalAlertes = this.allAlertes.length;
          this.totalPages = Math.ceil(this.totalAlertes / this.limit);
          if (this.totalPages === 0) {
            this.totalPages = 1;
          }
          this.updateDisplayedAlertes();
          this.paginationArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } else {
          console.log('Aucune alerte trouvée.');
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des alertes:', error);
      });
  }

  updateDisplayedAlertes() {
    const startIndex = (this.currentPage - 1) * this.limit;
    this.alertes = this.allAlertes.slice(startIndex, startIndex + this.limit);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedAlertes();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedAlertes();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updateDisplayedAlertes();
  }

  showDetails(alerte: Alerte) {
    this.selectedAlerte = alerte;
  }

  closeModal() {
    this.selectedAlerte = null;
  }

  openInMaps() {
    if (this.selectedAlerte) {
      const latitude = this.selectedAlerte.coordonnees.latitude;
      const longitude = this.selectedAlerte.coordonnees.longitude;
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(url, '_blank');
    } else {
      console.error('Aucune alerte sélectionnée.');
    }
  }
 
  
  getPhotoUrl(photo: { chemin: string }): string {
    const baseUrl = 'http://localhost:3000';
  
    // Si le chemin contient déjà 'compressed', nous renvoyons directement l'URL complète
    if (photo.chemin.includes('uploads/alertes/compressed/')) {
      return `${baseUrl}/${photo.chemin}`;
    }
  
    // Sinon, nous préfixons le chemin avec 'uploads/alertes/compressed/'
    return `${baseUrl}/uploads/alertes/compressed/${photo.chemin.split('/').pop()}`;
  }
  
  
  
  
  
  
  photoLoadError(event: any) {
    console.error("Erreur de chargement de l'image :", event.target.src);
  }
  
}