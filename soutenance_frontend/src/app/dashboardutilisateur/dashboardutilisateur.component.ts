import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { UtilisateurService } from '../services/utilisateur.service';
import { CommonModule } from '@angular/common';
import { DasbordadminService } from '../services/servicedasbordadmin/dasbordadmin.service';
import { AlertPoubelleService } from '../services/services-alert-poubelle/alert-poubelle.service';
import { HttpClient } from '@angular/common/http';
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
  imports: [ CommonModule ],
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
  nombreDepots: number = 0;


  
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
    private router: Router,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    this.chargerNombreDepots();

    this.loadDepots();
    this.utilisateurService.getTotalUsers()
      .then(response => {
        this.nombreUtilisateurs = response.totalUsers; // Stocker le nombre d'utilisateurs
      })
      .catch(error => {
        console.error('Erreur lors de la récupération du nombre d\'utilisateurs:', error);
      });
  
  
    

      if (isPlatformBrowser(this.platformId)) {
         try {
           const leafletModule = await import('leaflet');
          (window as any).L = leafletModule;  // 👈 Obligatoire AVANT routing-machine

          // ✅ Maintenant L est défini globalement, routing machine va pouvoir l'étendre
          await import('leaflet-routing-machine');

          const L = leafletModule;
          console.log("L.Routing est défini ?", typeof L.Routing !== 'undefined');

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
  
    async loadDepots(): Promise<void> {
    console.log('Début de chargement des dépôts');
    try {
      this.depotService.getDepots().subscribe({
        next: async (depots) => {
          console.log('Dépôts récupérés:', depots);
          this.depots = depots;
          if (this.map) {
            console.log('Ajout des dépôts à la carte');
            const L = await import('leaflet');
            this.addDepotsToMap(L);
          } else {
            console.error('Carte non initialisée');
          }
        },
        error: (error) => {
          console.error('Erreur lors de la récupération des dépôts:', error);
        }
      });
    } catch (error) {
      console.error('Erreur lors du chargement des dépôts:', error);
    }
  }
   //recupere le nombre de depos
   chargerNombreDepots(): void {
    this.alertService.getDepotsCount().subscribe({
      next: (count: number) => {
        this.nombreDepots = count;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du nombre de dépôts', err);
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
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
          iconSize: [25, 80],
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
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [14, 22], // Taille plus petite
    iconAnchor: [12, 42], // Ancrage centré et en bas
    popupAnchor: [1, -34],
    className: 'depot-icon' // Ajoutez une classe pour le style CSS
  });

  // Appliquer un filtre CSS pour colorier l'icône des dépôts en vert
  const style = document.createElement('style');
  style.innerHTML = `
    .depot-icon {
      filter: hue-rotate(90deg) saturate(2) brightness(1.2);
    }
  `;
  document.head.appendChild(style);

  this.depots.forEach(depot => {
    const marker = L.marker([depot.coordonnees.latitude, depot.coordonnees.longitude], { icon: depotIcon })
      .addTo(this.map)
      .bindPopup(`Dépôt: ${depot.lieu} <br><i>Chargement distance et temps...</i>`);

    marker.on('click', () => {
      if (!this.userLocation) {
        marker.getPopup()?.setContent(`Dépôt: ${depot.lieu} <br><b>Position utilisateur non disponible</b>`);
        marker.openPopup();
        return;
      }

      // Ouvre le popup avec message de chargement immédiatement
      marker.getPopup()?.setContent(`Dépôt: ${depot.lieu}<br><i>Chargement distance et temps...</i>`);
      marker.openPopup();

      // Lance le calcul et mise à jour du popup
      this.findRouteAndDisplayInfo(depot, marker, L);
    });
  });
}

calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

findRouteAndDisplayInfo(depot: Depot, marker: any, L: any): void {
  if (!this.userLocation) {
    console.error('Position utilisateur non disponible');
    return;
  }

  // Calculer la distance entre la position de l'utilisateur et le dépôt
  const distanceKm = this.calculateDistance(
    this.userLocation.latitude,
    this.userLocation.longitude,
    depot.coordonnees.latitude,
    depot.coordonnees.longitude
  );

  // Supposons une vitesse moyenne de 30 km/h pour estimer la durée du trajet (plus réaliste en milieu urbain)
  const averageSpeedKmPerHour = 30;
  const durationHours = distanceKm / averageSpeedKmPerHour;
  const durationMinutes = Math.round(durationHours * 60);

  // Ajouter une marge de 10% pour les imprévus (trafic, feux de signalisation, etc.)
  const contingencyMargin = 0.1;
  const totalDurationMinutes = Math.round(durationMinutes * (1 + contingencyMargin));

  // Afficher la distance et la durée estimée dans le popup du marqueur
  marker.getPopup()?.setContent(`
    <b>Dépôt: ${depot.lieu}</b><br>
    Distance: ${distanceKm.toFixed(2)} km<br>
    Durée estimée:<span style="color:orange;"> ${totalDurationMinutes} minutes
  `);
  marker.openPopup();
}



  
}
      

 
  
  