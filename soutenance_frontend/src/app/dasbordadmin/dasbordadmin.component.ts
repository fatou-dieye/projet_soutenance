import { Component, OnInit, OnDestroy} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { PointageService } from '../services/pointage.service';
import { Router } from '@angular/router';
import { DasbordadminService } from '../services/servicedasbordadmin/dasbordadmin.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NiveauPoubelleService } from '../services/servicesSensor/niveau-poubelle.service';

@Component({
  selector: 'app-dasbordadmin',
  imports: [ RouterModule,  CommonModule ],
  templateUrl: './dasbordadmin.component.html',
  styleUrl: './dasbordadmin.component.css'
})

export class DasbordadminComponent  implements OnInit , OnDestroy {
  
  private depotPercentages: Map<number, number> = new Map();
 
   // Déclarer les variables pour les statistiques
   totalRecords: number = 0;
   records: any[] = [];
   totalCitoyens: number = 0;
   totalPersonnel: number = 0;
   totalAdministrateurs: number = 0;
   totalVideurs: number = 0;
   totalGardients: number = 0;
   alertesLast7Days: any[] = [];
   depots: any[] = [];
     // Nouvelles variables pour les alertes et pointages journaliers
  dailyAlertCount: number = 0;
  dailyAttendanceCount: number = 0;
  niveauPoubelle: number | null = null;
  private subscription!: Subscription; // 

  constructor(private DasbordadminService: DasbordadminService,
    private  niveauPoubelleService:  NiveauPoubelleService,
    private pointageService: PointageService, private router: Router
   
  ) {
    // Enregistrer tous les composants Chart.js
    Chart.register(...registerables);
  }
  
  ngOnInit(): void {
   // Dans votre composant
   this.loadTodayAttendance();

   this.initGarbageLevelCharts();
   this.fetchStatistics();
   this.fetchAlertesLast7Days();
   this.fetchDepots();
   this.fetchDailyAlertCount();
    this.fetchDailyAttendanceCount();
    this.subscription = this. niveauPoubelleService.getSensorData().subscribe(
      data => {
        if (data && data.pourcentage !== undefined) {
          this.niveauPoubelle = data.pourcentage;
        }
      },
      err => console.error(err)
    );
    }
    
  
    ngOnDestroy() {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
    }
  

  fetchStatistics(): void {
    this.DasbordadminService .getUserStatistics().subscribe(
      (data) => {
        // Assigner les données récupérées aux variables
        this.totalCitoyens = data.utilisateur || 0;
        this.totalPersonnel = data.administrateur + data.videur + data.gardient || 0;
        this.totalAdministrateurs = data.administrateur || 0;
        this.totalVideurs = data.videur || 0;
        this.totalGardients = data.gardient || 0;
      },
      (error) => {
        console.error('Erreur lors de la récupération des statistiques', error);
      }
    );
  }

    // Méthode pour récupérer le nombre d'alertes journalières
    fetchDailyAlertCount(): void {
      this.DasbordadminService.getDailyAlertCount().subscribe(
        (count) => {
          this.dailyAlertCount = count;
        },
        (error) => {
          console.error('Erreur lors de la récupération du nombre d\'alertes journalières', error);
        }
      );
    }
  
    // Méthode pour récupérer le nombre de pointages journaliers
    fetchDailyAttendanceCount(): void {
      this.DasbordadminService.getDailyAttendanceCount().subscribe(
        (count) => {
          this.dailyAttendanceCount = count;
        },
        (error) => {
          console.error('Erreur lors de la récupération du nombre de pointages journaliers', error);
        }
      );
    }

  ngAfterViewInit(): void {
    // Initialiser les graphiques après que la vue soit complètement rendue
    setTimeout(() => {
      this.initAlertChart();
      this.initGarbageLevelCharts();
    }, 100);
  }
  
  fetchAlertesLast7Days(): void {
    this.DasbordadminService.getAlertesLast7Days().subscribe(
      (data) => {
        this.alertesLast7Days = data;
        this.initAlertChart();
      },
      (error) => {
        console.error('Erreur lors de la récupération des alertes des 7 derniers jours', error);
      }
    );
  }
  fetchDepots(): void {
    this.DasbordadminService.getDepots().subscribe(
      (data) => {
        this.depots = data;
        // Ajouter les pourcentages aux objets de dépôt
        this.depots.forEach((depot, index) => {
          if (index > 0) {
            // Utiliser l'ID du dépôt ou en générer un s'il n'existe pas
            const depotId = depot.id || index;
            if (!this.depotPercentages.has(depotId)) {
              this.depotPercentages.set(depotId, this.generateFixedPercentage(depotId));
            }
            // Ajouter le pourcentage directement à l'objet depot
            depot.percentage = this.depotPercentages.get(depotId);
          }
        });
        this.initGarbageLevelCharts();
      },
      (error) => {
        console.error('Erreur lors de la récupération des dépôts', error);
      }
    );
  }
  generateFixedPercentage(id: number): number {
    // Utiliser l'ID comme graine pour générer un pourcentage entre 0 et 100
    return (id * 17) % 101; // Formule simple qui donne des résultats différents basés sur l'ID
  }



  //methode pour generer une coleur aleatoire pou chaque graphe
  generateRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  initAlertChart(): void {
    const canvas = document.getElementById('alertChart');
    if (!canvas) {
      console.error("Canvas element 'alertChart' not found");
      return;
    }

    try {
      const ctx = (canvas as HTMLCanvasElement).getContext('2d');
      if (!ctx) {
        console.error("Could not get 2D context for alertChart");
        return;
      }

      const labels = this.alertesLast7Days.map(a => a.day);
      const data = this.alertesLast7Days.map(a => a.count);

      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Historique des alertes',
            data: data,
            backgroundColor: '#00A86B',
            borderColor: '#00A86B',
            borderWidth: 0,
            borderRadius: 8,
            barPercentage: 8,
            maxBarThickness: 40
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#333',
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              callbacks: {
                label: function(context) {
                  return `${context.parsed.y} alertes`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            }
          },
          animation: {
            duration: 1500
          },
          hover: {
            mode: 'index',
            intersect: false
          }
        }
      });
      console.log("Alert chart initialized successfully");
    } catch (error) {
      console.error("Error initializing alert chart:", error);
    }
  }


  
  initGarbageLevelCharts(): void {
    this.depots.forEach((depot, index) => {
      const elementId = `depotChart${index}`;
      let percentage;
  

      
   
      if (index === 0) {
        // Le premier dépôt utilise la valeur réelle du capteur
        percentage = this.niveauPoubelle !== null ? this.niveauPoubelle : 0;
        // Appliquer une couleur spécifique pour le premier dépôt
        const color = '#007BFF'; // Rouge orangé pour le premier dépôt
        console.log(`First depot color: ${color}, percentage: ${percentage}`);
        this.createDoughnutChart(elementId, percentage, color);
      } else {
        // Les autres dépôts utilisent leur valeur fixe stockée
        percentage = this.depotPercentages.get(depot.id || index) || 0;
        const color = this.generateRandomColor();
        this.createDoughnutChart(elementId, percentage, color);
      }
    });
    
  }
  
  createDoughnutChart(elementId: string, percentage: number, color: string): void {
    const canvas = document.getElementById(elementId);
    if (!canvas) {
      console.error(`Canvas element '${elementId}' not found`);
      return;
    }
  
    try {
      const ctx = (canvas as HTMLCanvasElement).getContext('2d');
      if (!ctx) {
        console.error(`Could not get 2D context for ${elementId}`);
        return;
      }
  
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Rempli', 'Vide'],
          datasets: [{
            data: [percentage, 100 - percentage],
            backgroundColor: [color, '#E0E0E0'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '80%',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: true,
              backgroundColor: '#333',
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              callbacks: {
                label: function(context) {
                  return context.parsed + '%';
                }
              }
            }
          },
          animation: {
            duration: 1500,
            animateRotate: true
          },
          hover: {
            mode: 'nearest',
            intersect: true
          },
        }
      });
      console.log(`${elementId} initialized successfully`);
    } catch (error) {
      console.error(`Error initializing ${elementId}:`, error);
    }
  }
  
   // Charger les pointages du jour
   loadTodayAttendance(): void {
    this.pointageService.getTodayAttendance().subscribe(
      (response) => {
        this.totalRecords = response.data.totalRecords;
        this.records = response.data.records;
      },
      (error) => {
        console.error('Erreur lors de la récupération des enregistrements:', error);
      }
    );
  }
  
  navigateToAttendanceList(): void {
    this.router.navigate(['/attendance-list']);
  }  


}