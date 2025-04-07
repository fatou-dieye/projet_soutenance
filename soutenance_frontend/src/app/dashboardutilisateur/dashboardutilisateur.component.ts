import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { UtilisateurService } from '../services/utilisateur.service';
import { CommonModule } from '@angular/common';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';

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

@Component({
  selector: 'app-dashboardutilisateur',
  imports: [SidebarreComponent, CommonModule],
  templateUrl: './dashboardutilisateur.component.html',
  styleUrls: ['./dashboardutilisateur.component.css']
})
export class DashboardutilisateurComponent implements OnInit {
  alertes: any[] = [];
  allAlertes: any[] = []; // Stocker toutes les alertes
 
  nombreUtilisateurs: number = 0;
  

  
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
    private router: Router
  ) {}

  async ngOnInit() {


    this.utilisateurService.getTotalUsers()
      .then(response => {
        this.nombreUtilisateurs = response.totalUsers; // Stocker le nombre d'utilisateurs
      })
      .catch(error => {
        console.error('Erreur lors de la récupération du nombre d\'utilisateurs:', error);
      });
  
  
    

    if (isPlatformBrowser(this.platformId)) {
      try {
        const mapContainer = document.getElementById('map-container');
        if (!mapContainer) {
          console.error("Le conteneur de la carte n'a pas été trouvé");
          return;
        }
    
        const L = await import('leaflet');
        console.log('Leaflet chargé:', L);
    
        const map = L.map('map-container', {
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
        }).addTo(map);
    
        // Icône personnalisée
        const customIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png', // URL de l'icône personnalisée
          iconSize: [20, 36], // Taille de l'icône
          iconAnchor: [12, 41], // Point de l'icône qui correspondra à la position du marqueur
          popupAnchor: [1, -34], // Point à partir duquel la popup doit s'ouvrir par rapport à l'icône
        });
    
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log("Position de l'utilisateur:", { latitude, longitude });
    
            // Exemple de coordonnées pour des marqueurs à Dakar
            const markers = [
              { name: "Point A", lat: 14.6928, lon: -17.4467, info: "Itinéraire vers Point A" },
              { name: "Point B", lat: 14.7166, lon: -17.4677, info: "Itinéraire vers Point B" },
              { name: "Point B", lat: 14.7500, lon: -17.4000, info: "Itinéraire vers Point B" },

        ];
              // Ajoutez d'autres marqueurs ici
          
    
            // Ajouter des marqueurs à la carte avec l'icône personnalisée
            markers.forEach((marker) => {
              const mapMarker = L.marker([marker.lat, marker.lon], { icon: customIcon }).addTo(map);
              mapMarker.bindPopup(`<b>${marker.name}</b><br>${marker.info}`);
    
              // Vérifiez si le marqueur est bien ajouté à la carte
              console.log(`Marqueur ajouté: ${marker.name} à la position [${marker.lat}, ${marker.lon}]`);
            });
    
            // Centrer la carte sur la position de l'utilisateur avec un zoom approprié
            map.setView([latitude, longitude], 13);
          },
          (error) => {
            console.error("Erreur lors de la récupération de la position :", error);
          }
        );
    
        map.invalidateSize();
    
       
    
      } catch (error) {
        console.error('Erreur lors du chargement de la carte Leaflet:', error);
      }
    }
    
    
  }


 
  
  
}
