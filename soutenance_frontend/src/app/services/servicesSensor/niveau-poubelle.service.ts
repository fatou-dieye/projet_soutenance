import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class NiveauPoubelleService {
  private socket: Socket;
  private trashLevelSubject = new Subject<number>();

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
  }

  // Observable que les composants peuvent souscrire pour obtenir les mises à jour
  getTrashLevelUpdates(): Observable<number> {
    return this.trashLevelSubject.asObservable();
  }
}