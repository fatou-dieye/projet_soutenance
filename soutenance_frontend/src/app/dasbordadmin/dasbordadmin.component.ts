import { Component, OnInit} from '@angular/core';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';
import { Chart, registerables } from 'chart.js';

import { AuthService } from '../serviceslogin/auth.service';
@Component({
  selector: 'app-dasbordadmin',
  imports: [SidebarreComponent],
  templateUrl: './dasbordadmin.component.html',
  styleUrl: './dasbordadmin.component.css'
})
export class DasbordadminComponent  implements OnInit {
  
   
  constructor() {
    // Enregistrer tous les composants Chart.js
    Chart.register(...registerables);
  }
  
  ngOnInit(): void {
   this.initAlertChart();
   this.initGarbageLevelCharts();
  }
  
  ngAfterViewInit(): void {
    // Initialiser les graphiques après que la vue soit complètement rendue
    setTimeout(() => {
      this.initAlertChart();
      this.initGarbageLevelCharts();
    }, 100);
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
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samdi', 'Dimanche'],
          datasets: [{
            label: 'Historique des alertes',
            data: [12, 19, 30, 15, 35, 22, 14],
            backgroundColor: '#00A86B',
            borderColor: '#00A86B',
            borderWidth: 0,
            borderRadius: 8,
            barPercentage: 8, // Rend les barres plus étroites
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