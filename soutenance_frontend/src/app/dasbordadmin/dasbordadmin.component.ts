import { Component, OnInit} from '@angular/core';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';
import { Chart, registerables } from 'chart.js';
import { DasbordadminService } from '../servicedasbordadmin/dasbordadmin.service';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-dasbordadmin',
  imports: [SidebarreComponent, RouterModule ],
  templateUrl: './dasbordadmin.component.html',
  styleUrl: './dasbordadmin.component.css'
})
export class DasbordadminComponent  implements OnInit {
   // Déclarer les variables pour les statistiques
   totalCitoyens: number = 0;
   totalPersonnel: number = 0;
   totalAdministrateurs: number = 0;
   totalVideurs: number = 0;
   totalGardients: number = 0;
   alertesLast7Days: any[] = [];
   
  constructor(private DasbordadminService: DasbordadminService) {
    // Enregistrer tous les composants Chart.js
    Chart.register(...registerables);
  }
  
  ngOnInit(): void {
   this.initGarbageLevelCharts();
   this.fetchStatistics();
   this.fetchAlertesLast7Days();
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
    // Créer les graphiques circulaires pour les niveaux de déchets
    this.createDoughnutChart('dakarPlateauChart', 85, '#8A2BE2');
    this.createDoughnutChart('pikineNordChart', 66, '#FFA500');
    this.createDoughnutChart('grandYoffChart', 90, '#FFA500');
    this.createDoughnutChart('hlmChart', 30, '#FF6347');
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

}