import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class NiveauPoubelleService {
  private socket: Socket;
  private trashLevelSubject = new Subject<number>();
  private newAlertSubject = new Subject<any>(); // Nouveau subject pour les alertes

  constructor() {
    // Connexion au serveur WebSocket
    this.socket = io('http://localhost:3000', {
      withCredentials: true
    });

    // Écoute de l'événement 'trash-level'
    this.socket.on('trash-level', (data: { niveauPoubelle: number }) => {
      console.log('Niveau de poubelle reçu:', data.niveauPoubelle);
      this.trashLevelSubject.next(data.niveauPoubelle);
    });

    // Écoute de l'événement 'new-alert'
    this.socket.on('new-alert', (data: any) => {
      console.log('Nouvelle alerte reçue:', data);
      this.newAlertSubject.next(data);
    });
  }

  // Observable que les composants peuvent souscrire pour obtenir les mises à jour du niveau
  getTrashLevelUpdates(): Observable<number> {
    return this.trashLevelSubject.asObservable();
  }

  // Observable pour les nouvelles alertes
  getNewAlertUpdates(): Observable<any> {
    return this.newAlertSubject.asObservable();
  }
}