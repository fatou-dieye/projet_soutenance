import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Socket, io } from 'socket.io-client';

interface Mesure {
  temperature: number;
  humidite: number;
  horodatage: Date;
  heurePrevue: string;
  etatVentilateur: boolean;
  alerteTemperature: boolean;
}

interface DerniereMesureResponse {
  success: boolean;
  mesure: Mesure;
  etatSysteme: {
    alerteActive: boolean;
    ventilationActive: boolean;
    derniereMiseAJour: Date;
  };
}

interface MesuresJourResponse {
  success: boolean;
  date: string;
  mesures: Mesure[];
  statistiques: {
    temperature: {
      moyenne: number;
      max: number;
      min: number;
    };
    humidite: {
      moyenne: number;
    };
    alertes: number;
    ventilation: {
      duree: number;
      nombreMesures: number;
    };
  };
}

interface MesuresHeuresSpecifiquesResponse {
  success: boolean;
  date: string;
  mesures: {
    heure: string;
    donnees: Mesure | null;
    statut: 'mesuré' | 'non mesuré' | 'à venir';
  }[];
  metadata: {
    total: number;
    mesuresEffectuees: number;
    mesuresManquees: number;
    mesuresRestantes: number;
    estAujourdhui: boolean;
  };
}

interface MoyennesJournalieresResponse {
  success: boolean;
  date: string;
  statistiques: {
    temperature: {
      moyenne: number;
      max: number;
      min: number;
    };
    humidite: {
      moyenne: number;
    };
    alertes: number;
    ventilation: {
      dureeActivation: number;
      pourcentage: number;
    };
    nombreMesures: number;
  } | null;
}

interface HistoriqueSemaineResponse {
  success: boolean;
  periode: {
    debut: Date;
    fin: Date;
  };
  historique: {
    date: string;
    mesures: Mesure[];
    nombreMesures: number;
  }[];
}

interface ControleVentilateurResponse {
  success: boolean;
  message: string;
  mesure: Mesure;
  alerte: {
    type: string;
    message: string;
  } | null;
}

@Injectable({
  providedIn: 'root'
})
export class MesureService implements OnDestroy {
  private apiUrl = 'http://localhost:3000/api/mesures';
  private webSocketUrl = 'http://localhost:3000';
  private socket: Socket;

  constructor(private http: HttpClient) {
    this.socket = io(this.webSocketUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('temperature_update', () => {
      console.log('rttt this.socket');
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connecté', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erreur connexion WebSocket:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket déconnecté:', reason);
    });
  }

  getDerniereMesure(): Observable<DerniereMesureResponse> {
    return this.http.get<DerniereMesureResponse>(`${this.apiUrl}/derniere`)
      .pipe(catchError(this.handleError));
  }

  getMesuresJour(date: string): Observable<MesuresJourResponse> {
    return this.http.get<MesuresJourResponse>(`${this.apiUrl}/jour/${date}`)
      .pipe(catchError(this.handleError));
  }

  getMesuresHeuresSpecifiques(date: string): Observable<MesuresHeuresSpecifiquesResponse> {
    return this.http.get<MesuresHeuresSpecifiquesResponse>(`${this.apiUrl}/heures-specifiques/${date}`)
      .pipe(catchError(this.handleError));
  }

  getMoyennesJournalieres(date: string): Observable<MoyennesJournalieresResponse> {
    return this.http.get<MoyennesJournalieresResponse>(`${this.apiUrl}/moyennes/${date}`)
      .pipe(catchError(this.handleError));
  }

  getHistoriqueSemaine(): Observable<HistoriqueSemaineResponse> {
    return this.http.get<HistoriqueSemaineResponse>(`${this.apiUrl}/historique`)
      .pipe(catchError(this.handleError));
  }

  controlerVentilateur(etat: boolean, temperature: number, humidite: number): Observable<ControleVentilateurResponse> {
    return this.http.post<ControleVentilateurResponse>(`${this.apiUrl}/ventilateur`, {
      etat,
      temperature,
      humidite
    }).pipe(catchError(this.handleError));
  }

  onTemperatureUpdate(): Observable<Mesure> {
    return new Observable(observer => {
      this.socket.on('temperature_update', (data: Mesure) => {
        console.log('Données reçues:', data);
        observer.next(data);
      });

      this.socket.on('error', (error: any) => {
        console.error('Erreur socket:', error);
        observer.error(error);
      });

      return () => {
        this.socket.off('temperature_update');
        this.socket.off('error');
      };
    });
  }

  private handleError(error: any) {
    console.error('Erreur HTTP:', error);
    return throwError(() => new Error(error.message || 'Erreur serveur'));
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.off('temperature_update');
      this.socket.off('error');
      this.socket.off('connect');
      this.socket.off('connect_error');
      this.socket.off('disconnect');
      this.socket.disconnect();
    }
  }
}
