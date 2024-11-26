import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import Chart from 'chart.js/auto';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

interface DailyRecord {
  heure: string;
  temperature: number;
  humidite: number;
  etat: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  userName: string = '';
  userRole: string = '';
  currentTemp: number = 28;
  currentHumidity: number = 50;
  formStatusMessage: { type: 'success' | 'error'; text: string } | null = null;
  chart: Chart | null = null;

  dailyData: DailyRecord[] = [
    { heure: '10:00', temperature: 26.5, humidite: 40, etat: 'Normal' },
    { heure: '14:00', temperature: 26.5, humidite: 80, etat: 'Élevé' },
    { heure: '17:00', temperature: 24.5, humidite: 50, etat: 'Normal' }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private router: Router
  ) {
    this.loadUserInfo();
  }

  private loadUserInfo() {
    try {
      const user = this.authService.getUserFromToken();
      console.log('User info:', user);

      if (user) {
        if (user.nom && user.prenom) {
          const prenom = user.prenom.charAt(0).toUpperCase() + user.prenom.slice(1).toLowerCase();
          const nom = user.nom.charAt(0).toUpperCase() + user.nom.slice(1).toLowerCase();
          this.userName = `${prenom}`;
        } else {
          this.userName = 'Utilisateur';
        }
        
        if (user.role) {
          this.userRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        }
      } else {
        this.userName = 'Utilisateur';
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      this.userName = 'Utilisateur';
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initChart();
      }, 0);
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  // Méthodes pour la température
  isHighTemperature(): boolean {
    return this.currentTemp > 27;
  }

  getTemperatureStatus(): string {
    if (this.currentTemp > 27) return 'Élevé';
    if (this.currentTemp < 20) return 'Bas';
    return 'Normal';
  }

  getTemperatureClass(): string {
    if (this.currentTemp > 27) return 'high';
    if (this.currentTemp < 20) return 'low';
    return 'normal';
  }

  // Méthodes pour l'humidité
  isHighHumidity(): boolean {
    return this.currentHumidity > 60;
  }

  getHumidityStatus(): string {
    if (this.currentHumidity > 60) return 'Élevé';
    if (this.currentHumidity < 30) return 'Bas';
    return 'Normal';
  }

  getHumidityClass(): string {
    if (this.currentHumidity > 60) return 'high';
    if (this.currentHumidity < 30) return 'low';
    return 'normal';
  }

  private initChart() {
    const ctx = document.getElementById('tempHumidityChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [
          {
            label: 'Température',
            data: [20, 25, 28, 30, 35, 40, 45],
            borderColor: '#4318FF',
            tension: 0.4,
            fill: false
          },
          {
            label: 'Humidité',
            data: [30, 35, 40, 45, 50, 55, 56],
            borderColor: '#14AE5C',
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: '#E2E8F0'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  formatValue(value: number, type: 'temp' | 'humidity'): string {
    return type === 'temp' ? `${value}°C` : `${value}%`;
  }

  async logout(): Promise<void> {
    try {
      if (isPlatformBrowser(this.platformId)) {
        await this.authService.clearToken();
        await this.authService.clearUtilisateur();
        
        this.formStatusMessage = { type: 'success', text: 'Déconnexion réussie' };
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { message: 'Déconnexion réussie' }
          });
        }, 500);
      }
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      this.formStatusMessage = { type: 'error', text: 'Erreur lors de la déconnexion' };
    }
  }
}