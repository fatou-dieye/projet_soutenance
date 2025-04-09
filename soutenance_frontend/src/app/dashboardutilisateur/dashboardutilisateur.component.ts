import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { UtilisateurService } from '../services/utilisateur.service';
import { CommonModule } from '@angular/common';
import { DasbordadminService } from '../services/dasbordadmin.service';
import { AlertPoubelleService } from '../services/alertpoubelle.service';

declare var L: any; // Ajoutez cette déclaration globale


interface Signal {
  nom: string;
  distance: number;
  coordonnees: {
    latitude: number;
    longitude: number;
  };
}

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

interface Depot {
  _id: string;
  lieu: string;
  coordonnees: {
    latitude: number;
    longitude: number;
  };
}

@Component({
  selector: 'app-dashboardutilisateur',
  imports: [ CommonModule],
  templateUrl: './dashboardutilisateur.component.html',
  styleUrls: ['./dashboardutilisateur.component.css']
})
export class DashboardutilisateurComponent implements OnInit {
  alertes: any[] = [];
  allAlertes: any[] = []; // Stocker toutes les alertes
 
  nombreUtilisateurs: number = 0;

  depotCount: number = 0;
  depots: Depot[] = [];
  map: any;
  userLocation: { latitude: number, longitude: number } | null = null;
  closestDepot: Depot | null = null;
  

  
  signals: Alerte[] = [
    {
      dateCreation: new Date('2025-03-03T02:00:12.676+00:00'),
      adresse: '123 Rue Exemple, Dakar',
      description: 'Description de l\'alerte',
      coordonnees: { latitude: 14.6937, longitude: -17.4441 },
      photos: [
        {
          chemin: '/uploads/alertes/compressed/alerte-1740967211544-564684978.png',
          _id: '67c50d2cb7d152c0d5a82053',
          dateAjout: new Date('2025-03-03T02:00:12.676+00:00')
        },
        {
          chemin: '/uploads/alertes/compressed/alerte-1740967211546-260257301.png',
          _id: '67c50d2cb7d152c0d5a82054',
          dateAjout: new Date('2025-03-03T02:00:12.678+00:00')
        }
      ]
    }
    // Ajouter d'autres alertes ici
  ];

  
  

  // Fonction pour fermer le modal
 

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private utilisateurService: UtilisateurService,
    private depotService: DasbordadminService,
    private alertService: AlertPoubelleService,
    private router: Router
  ) {}

  async ngOnInit() {

    this.loadDepots(); // Ajoutez cette ligne
    this.loadDepotCount();
    this.utilisateurService.getTotalUsers()
      .then(response => {
        this.nombreUtilisateurs = response.totalUsers; // Stocker le nombre d'utilisateurs
      })
      .catch(error => {
        console.error('Erreur lors de la récupération du nombre d\'utilisateurs:', error);
      });
  
  
    

      if (isPlatformBrowser(this.platformId)) {
        try {
          const L = await import('leaflet');
          const mapContainer = document.getElementById('map-container');
          if (!mapContainer) {
            console.error("Le conteneur de la carte n'a pas été trouvé");
            return;
          }
  
          this.map = L.map('map-container', {
            center: [14.6928, -17.4467], // Centre de Dakar
            zoom: 13,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            scrollWheelZoom: true,
            boxZoom: true,
          });
  
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(this.map);
  
          // Récupérer la position de l'utilisateur
          navigator.geolocation.getCurrentPosition(
            (position) => {
              this.userLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              this.map.setView([this.userLocation.latitude, this.userLocation.longitude], 13);
              this.addUserMarker(L);
              this.addDepotsToMap(L);
            },
            (error) => {
              console.error("Erreur lors de la récupération de la position :", error);
              this.addDepotsToMap(L);
            }
          );
        } catch (error) {
          console.error('Erreur lors du chargement de la carte Leaflet:', error);
        }
      }
  
     
    }
  
    loadDepots(): void {
      console.log('Début de chargement des dépôts');
      this.depotService.getDepots().subscribe({
        next: (depots) => {
          console.log('Dépôts récupérés:', depots);
          this.depots = depots;
          if (this.map) {
            console.log('Ajout des dépôts à la carte');
            this.addDepotsToMap(require('leaflet'));
          } else {
            console.error('Carte non initialisée');
          }
        },
        error: (error) => {
          console.error('Erreur lors de la récupération des dépôts:', error);
        }
      });
    }
  
  //recupere le nombre de depos
    loadDepotCount(): void {
      this.alertService.getDepotsCount().subscribe({
        next: (count) => {
          this.depotCount = count;
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.depotCount = 0; // Valeur par défaut en cas d'erreur
        }
      });
    }
  
    addUserMarker(L: any): void {
      if (this.userLocation) {
        const userIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });
  
        
        const userMarker = L.marker([this.userLocation.latitude, this.userLocation.longitude], { icon: userIcon })
          .addTo(this.map)
          .bindPopup('Votre position');
      }
    }
  
    addDepotsToMap(L: any): void {
      const depotIcon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',// Icône de dépôt avec une couleur plus pâle
        iconSize: [14, 22], // Taille plus petite
        iconAnchor: [12, 42], // Ancrage centré et en bas
        popupAnchor: [1, -34],
      });
  // Appliquer un filtre CSS pour colorier l'icône des dépôts en vert
  const style = document.createElement('style');
  style.innerHTML = `
    .leaflet-marker-icon.depot-icon {
      filter: hue-rotate(90deg) saturate(2) brightness(1.2); /* Applique une couleur verte à l'icône */
    }
  `;
  document.head.appendChild(style);
      
      this.depots.forEach(depot => {
        const marker = L.marker([depot.coordonnees.latitude, depot.coordonnees.longitude], { icon: depotIcon })
          .addTo(this.map)
          .bindPopup(`Dépôt: ${depot.lieu}`);
  
        marker.on('click', () => this.findRouteToDepot(depot, L));
      });
  
      this.findClosestDepot(L);
    }
  
    findClosestDepot(L: any): void {
      if (this.userLocation && this.depots.length > 0) {
        this.closestDepot = this.depots.reduce((closest, depot) => {
          const distance = this.calculateDistance(
            this.userLocation!.latitude, this.userLocation!.longitude,
            depot.coordonnees.latitude, depot.coordonnees.longitude
          );
          return distance < this.calculateDistance(
            this.userLocation!.latitude, this.userLocation!.longitude,
            closest.coordonnees.latitude, closest.coordonnees.longitude
          ) ? depot : closest;
        });
  
        console.log('Dépôt le plus proche:', this.closestDepot);
      }
    }
  
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371; // Rayon de la Terre en kilomètres
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      return R * c;
    }
  
    deg2rad(deg: number): number {
      return deg * (Math.PI/180);
    }
  
    //route pour trouver un depos 
    findRouteToDepot(depot: Depot, L: any = window.L): void {
      // Vérifications de sécurité
      if (!L || !L.Routing) {
        console.error('Leaflet ou Routing Machine non chargé');
        return;
      }
  
      // Vérifier la présence de la position utilisateur
      if (!this.userLocation) {
        console.error('Position utilisateur non disponible');
        return;
      }
  
      // Supprimer les anciens calques de routage
      this.map.eachLayer((layer: any) => {
        if (layer instanceof L.Routing.Control) {
          this.map.removeControl(layer);
        }
      });
  
      // Créer le contrôle de routage
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(this.userLocation.latitude, this.userLocation.longitude),
          L.latLng(depot.coordonnees.latitude, depot.coordonnees.longitude)
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [{ 
            color: 'blue', 
            opacity: 0.8, 
            weight: 5 
          }]
        }
      }).addTo(this.map);
  
      // Gérer les événements de routage
      routingControl.on('routesfound', (e: any) => {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const bounds = L.latLngBounds(routes[0].coordinates);
          this.map.fitBounds(bounds);
        }
      });
  
      routingControl.on('routingerror', (error: Error) => {
        console.error('Erreur de routage:', error.message);
      });
    }

 
  
  
}
