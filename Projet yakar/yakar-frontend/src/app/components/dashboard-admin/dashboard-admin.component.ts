import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import Chart from 'chart.js/auto';
import { AuthService } from '../../auth.service';
import { MesureService } from '../../mesure.service';
interface DailyRecord {
  heure: string;
  temperature: number;
  humidite: number;
  etat: string;
}

interface Mesure {
  temperature: number;
  humidite: number;
  horodatage: Date;
  etatVentilateur: boolean;
  alerteTemperature: boolean;
}

interface ChartData {
  temperatures: number[];
  humidites: number[];
  labels: string[];
  averageTemp: number;
  averageHumidity: number;
}

interface ChartPeriod {
  days: number;
  label: string;
}

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  userName: string = '';
  userRole: string = '';
  currentTemp: number | null = null;
  currentHumidity: number | null = null;
  formStatusMessage: { type: 'success' | 'error'; text: string } | null = null;
  fanStatus: boolean = false;
  chart: Chart | null = null;
  dailyData: DailyRecord[] = [];
  selectedPeriod: ChartPeriod = { days: 7, label: '7 jours' };
  chartPeriods: ChartPeriod[] = [
    { days: 7, label: '7 jours' },
    { days: 3, label: '3 jours' }
  ];
  averageTemp: number = 0;
  averageHumidity: number = 0;
  tempProgress: number = 0;
  humidityProgress: number = 0;
  private subscriptions: Subscription = new Subscription();
  private chartData = {
    temperatures: [] as number[],
    humidites: [] as number[],
    labels: [] as string[]
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private mesureService: MesureService,
    public router: Router
  ) {
    this.loadUserInfo();
  }

  private async loadUserInfo(): Promise<void> {
    try {
      const user = this.authService.getUserFromToken();
      if (user) {
        if (user.nom && user.prenom) {
          const prenom = user.prenom.charAt(0).toUpperCase() + user.prenom.slice(1).toLowerCase();
          const nom = user.nom.charAt(0).toUpperCase() + user.nom.slice(1).toLowerCase();
          this.userName = `${prenom} ${nom}`;
        } else {
          this.userName = 'Utilisateur';
        }

        if (user.role) {
          this.userRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        }
      } else {
        this.userName = 'Utilisateur';
        await this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      this.userName = 'Utilisateur';
      await this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeRealTimeData();
      this.loadScheduledData();
      this.loadChartData(this.selectedPeriod.days);
      setTimeout(() => this.initChart(), 0);
    }
  }

  private initializeRealTimeData() {
    console.log('Initialisation des données en temps réel...');
    this.subscriptions.add(
      this.mesureService.onTemperatureUpdate().subscribe({
        next: (data: Mesure) => {
          console.log('Données reçues:', data);
          this.updateCurrentData(data);
          this.updateChartData(data);
        },
        error: (error) => console.error('Erreur WebSocket:', error)
      })
    );
  }

  private loadScheduledData() {
    const today = new Date().toISOString().split('T')[0];
    this.subscriptions.add(
      this.mesureService.getMesuresHeuresSpecifiques(today).subscribe(response => {
        if (response.success) {
          this.dailyData = response.mesures.map(m => ({
            heure: m.heure,
            temperature: m.donnees?.temperature || 0,
            humidite: m.donnees?.humidite || 0,
            etat: this.getEtatFromMesure(m.donnees)
          }));
        }
      })
    );
  }

  updateChartPeriod(period: ChartPeriod) {
    this.selectedPeriod = period;
    this.loadChartData(period.days);
  }

  private loadChartData(days: number) {
    this.subscriptions.add(
      this.mesureService.getHistoriqueSemaine().pipe(
        map(data => this.processChartData(data, days))
      ).subscribe(chartData => {
        this.updateChartDisplay(chartData);
      })
    );
  }

  private processChartData(data: any, days: number): ChartData {
    const now = new Date();
    const startDate = new Date(now.setDate(now.getDate() - days));

    const filteredData = data.historique.filter((jour: any) =>
      new Date(jour.date) >= startDate
    );

    let temps: number[] = [];
    let hums: number[] = [];
    let labels: string[] = [];
    let sumTemp = 0;
    let sumHum = 0;
    let count = 0;

    filteredData.forEach((jour: any) => {
      jour.mesures.forEach((mesure: any) => {
        temps.push(mesure.temperature);
        hums.push(mesure.humidite);
        labels.push(new Date(mesure.horodatage).toLocaleTimeString());
        sumTemp += mesure.temperature;
        sumHum += mesure.humidite;
        count++;
      });
    });

    return {
      temperatures: temps,
      humidites: hums,
      labels: labels,
      averageTemp: count ? sumTemp / count : 0,
      averageHumidity: count ? sumHum / count : 0
    };
  }

  private updateChartDisplay(chartData: ChartData) {
    this.chartData.temperatures = chartData.temperatures;
    this.chartData.humidites = chartData.humidites;
    this.chartData.labels = chartData.labels;

    this.averageTemp = chartData.averageTemp;
    this.averageHumidity = chartData.averageHumidity;
    this.tempProgress = (this.averageTemp / 50) * 100;
    this.humidityProgress = this.averageHumidity;

    this.updateChart();
  }

  private updateCurrentData(data: Mesure) {
    this.currentTemp = data.temperature;
    this.currentHumidity = data.humidite;
    this.fanStatus = data.etatVentilateur;
  }

  private updateChartData(data: Mesure) {
    const time = new Date(data.horodatage).toLocaleTimeString();

    this.chartData.temperatures.push(data.temperature);
    this.chartData.humidites.push(data.humidite);
    this.chartData.labels.push(time);

    if (this.chartData.labels.length > 20) {
      this.chartData.temperatures.shift();
      this.chartData.humidites.shift();
      this.chartData.labels.shift();
    }

    this.updateChart();
  }

  private updateChart() {
    if (this.chart) {
      this.chart.data.labels = this.chartData.labels;
      this.chart.data.datasets[0].data = this.chartData.temperatures;
      this.chart.data.datasets[1].data = this.chartData.humidites;
      this.chart.update();
    }
  }

  private initChart() {
    const ctx = document.getElementById('tempHumidityChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.chartData.labels,
        datasets: [
          {
            label: 'Température',
            data: this.chartData.temperatures,
            borderColor: '#4318FF',
            tension: 0.4,
            fill: false
          },
          {
            label: 'Humidité',
            data: this.chartData.humidites,
            borderColor: '#14AE5C',
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: '#E2E8F0' }
          },
          x: {
            grid: { display: false }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  private getEtatFromMesure(mesure: Mesure | null): string {
    if (!mesure) return 'Non mesuré';
    if (mesure.alerteTemperature) return 'Critique';
    if (mesure.temperature > 27) return 'Élevé';
    if (mesure.temperature < 20) return 'Bas';
    return 'Normal';
  }

  toggleFan(status: boolean): void {
    if (this.currentTemp === null || this.currentHumidity === null) {
      this.formStatusMessage = {
        type: 'error',
        text: 'Impossible de contrôler le ventilateur : données manquantes'
      };
      return;
    }

    this.fanStatus = status;
    this.subscriptions.add(
      this.mesureService.controlerVentilateur(status, this.currentTemp, this.currentHumidity)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.formStatusMessage = {
                type: 'success',
                text: `Ventilateur ${status ? 'activé' : 'désactivé'} avec succès`
              };
            }
          },
          error: (error) => {
            console.error('Erreur contrôle ventilateur:', error);
            this.formStatusMessage = {
              type: 'error',
              text: 'Erreur lors du contrôle du ventilateur'
            };
            this.fanStatus = !status;
          }
        })
    );
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

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  getCurrentDate(): Date {
    return new Date();
  }

  // Méthodes utilitaires pour les templates
  isHighTemperature(): boolean {
    return this.currentTemp !== null && this.currentTemp > 27;
  }

  getTemperatureStatus(): string {
    if (this.currentTemp === null) return 'Indisponible';
    if (this.currentTemp > 27) return 'Élevé';
    if (this.currentTemp < 20) return 'Bas';
    return 'Normal';
  }

  getTemperatureClass(): string {
    if (this.currentTemp === null) return 'unavailable';
    if (this.currentTemp > 27) return 'high';
    if (this.currentTemp < 20) return 'low';
    return 'normal';
  }

  isHighHumidity(): boolean {
    return this.currentHumidity !== null && this.currentHumidity > 60;
  }

  getHumidityStatus(): string {
    if (this.currentHumidity === null) return 'Indisponible';
    if (this.currentHumidity > 60) return 'Élevé';
    if (this.currentHumidity < 30) return 'Bas';
    return 'Normal';
  }

  getHumidityClass(): string {
    if (this.currentHumidity === null) return 'unavailable';
    if (this.currentHumidity > 60) return 'high';
    if (this.currentHumidity < 30) return 'low';
    return 'normal';
  }

  formatValue(value: number | null, type: 'temp' | 'humidity'): string {
    if (value === null) return 'N/A';
    return type === 'temp' ? `${value}°C` : `${value}%`;
  }

  isDashboardRoute(): boolean {
    return this.router.url === '/dashboard-admin';
  }
}
