import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

interface RFIDStatus {
  message: string;
  data: {
    carte_rfid: string;
    guard_id: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket;

  constructor() {
    // Connectez-vous au serveur WebSocket
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'], // Utilisation exclusive de WebSocket
    });

    // Ajoutez un écouteur pour vérifier la connexion
    this.socket.on('connect', () => {
      console.log('Connecté au serveur WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Déconnecté du serveur WebSocket');
    });
  }

  // Envoie des données RFID au serveur
  sendRFIDData(carte_rfid: string, guard_id: string) {
    console.log('Envoi des données RFID:', { carte_rfid, guard_id });
    this.socket.emit('rfid-scanned', { cardId: carte_rfid, guard_id }); // cardId au lieu de carte_rfid
  }

  // Recevoir une réponse du serveur
  receiveRFIDStatus(): Observable<RFIDStatus> {
    return new Observable<RFIDStatus>((observer) => {
      this.socket.on('rfid-status', (data: RFIDStatus) => {
        console.log('Réponse RFID reçue:', data);
        observer.next(data);
      });
    });
  }

  // Méthode publique pour accéder à la socket
  getSocket(): Socket {
    return this.socket;
  }
}
