
import { Component, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UtilisateurService } from '../services/utilisateur.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';
import { SafeUrlPipe } from '../../safe-url.pipe';

@Component({
  selector: 'app-gestion-des-signeau-citoyen',
  imports: [SidebarreComponent, FormsModule, CommonModule ],
  templateUrl: './gestion-des-signeau-citoyen.component.html',
  styleUrl: './gestion-des-signeau-citoyen.component.css'
})
export class GestionDesSigneauCitoyenComponent implements AfterViewInit {
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
        this.initMap(); // Initialisation de la carte
  
        // Centrer la carte sur la localisation de l'utilisateur
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
  
        // Afficher le bouton "Suivant" après avoir obtenu la position
        this.showNextButton = true;
  
        // Cacher le bouton de partage et le texte
        const shareButton = document.querySelector('.share-location') as HTMLElement;
        const shareText = document.querySelector('.step-header p') as HTMLElement;
        const icon = document.querySelector('.step-header i') as HTMLElement;
  
        if (shareButton) { shareButton.style.display = 'none'; }
        if (shareText) { shareText.style.display = 'none'; }
        if (icon) { icon.style.display = 'none'; }
  
        // Redimensionner la carte après l'affichage
        setTimeout(() => {
          this.map.invalidateSize(); // Redimensionner la carte pour s'adapter au conteneur
        }, 500); // Le délai garantit que la carte a été affichée avant le redimensionnement
  
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
      this.photoUrls = files.map(file => URL.createObjectURL(file));  // Crée des URLs pour les aperçus
      this.errorMessage = '';  // Réinitialise le message d'erreur si le nombre de photos est valide
    } else {
      this.errorMessage = "Vous ne pouvez ajouter que 4 photos maximum.";
    }
  }

  nextStep() {
    if (this.currentStep === 1) {
      // Vérification si la géolocalisation est partagée
      if (this.latitude === 0 || this.longitude === 0) {
        this.showErrorMessage = true; // Afficher un message d'erreur si la géolocalisation n'est pas partagée
        return;
      }
    } else if (this.currentStep === 2) {
      // Vérification si des photos sont ajoutées (facultatif si besoin)
      if (this.photos.length === 0) {
        this.errorMessage = 'Veuillez ajouter au moins une photo pour continuer.';
        return;
      }
    } else if (this.currentStep === 3) {
      // Vérification de la description
      if (!this.description.trim()) {
        this.errorMessage = 'Veuillez entrer une description avant de continuer';
        return;
      }
    }
  
    // Si tout est validé, on passe à l'étape suivante
    if (this.currentStep < 3) {
      this.currentStep++; // Incrémenter l'étape
      this.updateProgress(); // Mettre à jour la barre de progression
    }
  }
  
  
  
  

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgress();
      this.errorMessage = ''; // Réinitialise le message d'erreur
    }
  }

  updateProgress() {
    const progress = (this.currentStep - 1) * 33; // La barre de progression sera 0% au début, 33% à l'étape 1, etc.
    const progressBar = document.querySelector('.progress-line') as HTMLElement;
    
    if (progressBar) {
      progressBar.style.width = `${progress}%`; // Mettre à jour la largeur de la barre de progression
    }
  }
  
  
  
  finishStep() {
    // Vérification si la description est remplie
    if (!this.description.trim()) {
      this.errorMessage = 'Veuillez entrer une description avant de continuer';
      return; // Arrêter le processus si la description est vide
    }
  
    const alerte = {
      description: this.description,
      adresse: `Latitude: ${this.latitude}, Longitude: ${this.longitude}`,
      latitude: this.latitude,
      longitude: this.longitude,
      photos: this.photos
    };
  
    // Appel à la méthode pour créer l'alerte
    this.utilisateurService.createAlerte(alerte)
      .then(response => {
        // Ouvrir le modal de succès
        this.openSuccessModal(response.message);
  
        // Mettre à jour la barre de progression à 100%
        this.updateProgress();  // Cela met immédiatement la barre à 100%
  
        // Assurez-vous que la barre de progression atteint 100% avant de réinitialiser
        const progressBar = document.querySelector('.progress-line') as HTMLElement;
        if (progressBar) {
          progressBar.style.width = '100%'; // Force la barre à être à 100% avant la réinitialisation
        }
  
        // Attendre quelques secondes pour permettre à l'utilisateur de voir la barre de progression à 100%
        setTimeout(() => {
          // Réinitialisation du formulaire et retour à l'étape 1
          this.resetForm();  // Réinitialiser le formulaire
          this.currentStep = 1; // Revenir à l'étape 1 (Géolocalisation)
  
          // Réinitialiser la barre de progression à 0% (après l'attente)
          this.updateProgress();
        }, 1500); // Attendre 1.5 secondes avant de réinitialiser
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
    // Réinitialisation des variables nécessaires à l'étape 1
    this.latitude = 0;
    this.longitude = 0;
    this.photos = [];
    this.photoUrls = [];
    this.description = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.showNextButton = false;
  
    // Réinitialisation de l'affichage de la carte
    const mapElement = document.getElementById('map');
    if (mapElement) {
      mapElement.classList.remove('show-map'); // Cache la carte
    }
  
    // Supprimer la carte Leaflet si elle existe
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  
    // Réaffichage du bouton "Partager" et du texte
    const shareButton = document.querySelector('.share-location') as HTMLElement;
    if (shareButton) {
      shareButton.style.display = 'inline-block'; // Réafficher le bouton "Partager"
    }
  
    const stepHeader = document.querySelector('.step-header p') as HTMLElement;
    if (stepHeader) {
      stepHeader.style.display = 'block'; // Réafficher le texte "Nous avons besoin de votre position..."
    }
  
    const icon = document.querySelector('.step-header i') as HTMLElement;
    if (icon) {
      icon.style.display = 'inline-block'; // Réafficher l'icône de localisation
    }
  
    // Masquer les messages d'erreur
    this.showErrorMessage = false;
  }
  
}
