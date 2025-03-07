import { Component, OnInit } from '@angular/core';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';
import { PointageService } from '../services/pointage.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../services/websocket.service';



interface Gardien {
  _id: string;
  prenom: string;
  nom: string;
  carte_rfid : string;
  premierPointage: string;
  dernierPointage: string; 
  photo: File; 
  assigned_at: Date;
}

interface ApiResponse {
  data: Gardien[];
  totalPages: number;
}
@Component({
  selector: 'app-pointage',
  standalone: true,
  imports: [SidebarreComponent, CommonModule, FormsModule],
  templateUrl: './pointage.component.html',
  styleUrls: ['./pointage.component.css']
})
export class PointageComponent implements OnInit {
  
  gardiens: Gardien[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;
  showModal: boolean = false;
  selectedGardien: Gardien | null = null;
  rfidCardNumber: string = '';
  errorMessage: string = '';
  socket: any;

  constructor(private pointageService: PointageService, private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    this.loadAllGardiens();
    setTimeout(() => {
      console.log('Liste des gardiens:', this.gardiens);
    }, 2000); // Attendre un peu pour voir les données chargées

    this.webSocketService.receiveRFIDStatus().subscribe((status) => {
      console.log('Statut du RFID:', status.message);
    });

    // Initialisation correcte de la socket
    this.socket = this.webSocketService.getSocket();

    if (this.socket) {
      this.socket.on('rfid-scanned', (data: { cardId: string }) => {
        console.log('Carte RFID scannée reçue:', data);
        this.rfidCardNumber = data.cardId; // Extraire uniquement la valeur de cardId
      });
    } else {
      console.error("La connexion WebSocket n'est pas établie.");
    }
  }

  loadAllGardiens(): void {
    this.pointageService.getAllGardiens(this.currentPage, this.itemsPerPage).subscribe(
      (data: ApiResponse) => {
        console.log('Données reçues:', data); // Vérifiez le format de la réponse
        this.gardiens = data.data || []; // Assurez-vous que c'est bien un tableau
        this.totalPages = data.totalPages || 1;
      },
      error => {
        console.error('Erreur lors de la récupération des gardiens', error);
      }
    );
  }

  openAssignModal(gardien: Gardien): void {
    this.selectedGardien = gardien;
    this.showModal = true;
    console.log('Modal ouvert pour le gardien:', gardien);
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedGardien = null;
    this.rfidCardNumber = '';
    this.errorMessage = ''; // Réinitialiser le message d'erreur
    console.log('Modal fermé');
  }

  confirmAssignRFID(): void {
    if (this.selectedGardien && this.rfidCardNumber) {
      if (this.validateRFID(this.rfidCardNumber)) {
        console.log('Assignation de la carte RFID:', this.rfidCardNumber, 'au gardien:', this.selectedGardien);
        this.assignRFID(this.rfidCardNumber, this.selectedGardien._id, `${this.selectedGardien.prenom} ${this.selectedGardien.nom}`);
        this.closeModal();
      } else {
        this.errorMessage = 'Numéro de carte RFID invalide';
      }
    } else {
      this.errorMessage = 'Numéro de carte RFID ou gardien non sélectionné';
      console.error(this.errorMessage);
    }
  }

  validateRFID(rfid: string): boolean {
    // Ajoutez ici votre logique de validation
    return rfid.length > 0; // Exemple simple : vérifie que le numéro n'est pas vide
  }

  assignRFID(carte_rfid: string, guard_id: string, name: string): void {
    this.pointageService.assignRFID(carte_rfid, guard_id).subscribe(
      data => {
        console.log('Carte RFID assignée avec succès', data);
        this.loadAllGardiens(); // Recharger la liste des gardiens
      },
      error => {
        console.error('Erreur lors de l\'assignation de la carte RFID', error);
        this.errorMessage = 'Erreur lors de l\'assignation de la carte RFID';
      }
    );
  }

  
  recordAttendance(guard_id: string, name: string, date: string, location: string): void {
    this.pointageService.recordAttendance(guard_id, name, date, location).subscribe(
      data => {
        console.log('Pointage enregistré avec succès', data);
      },
      error => {
        console.error('Erreur lors de l\'enregistrement du pointage', error);
      }
    );
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadAllGardiens();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAllGardiens();
    }
  }
}
