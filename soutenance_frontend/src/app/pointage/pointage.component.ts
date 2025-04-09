import { Component, OnInit } from '@angular/core';
import { PointageService } from '../services/pointage.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebSocketService } from '../services/websocket.service';

interface RFIDData {
  cardId: string;
}

interface Gardien {
  _id: string;
  prenom: string;
  nom: string;
  carte_rfid: string;
  premierPointage: string;
  dernierPointage: string;
  photo: File;
  assigned_at: Date;
  email: string;
  telephone: string;
  carte_etat: string; // 'active' ou 'bloqué'

}

interface ApiResponse {
  data: Gardien[];
  totalPages: number;
}

@Component({
  selector: 'app-pointage',
  standalone: true,
  imports: [ CommonModule, FormsModule],
  templateUrl: './pointage.component.html',
  styleUrls: ['./pointage.component.css']
})
export class PointageComponent implements OnInit {
  gardiens: Gardien[] = [];
  currentPage: number = 1;
  recordsPerPage: number = 4; // Nombre d'éléments par page
  totalRecords: number = 0;  // Nombre total d'éléments dans la base de données
  totalPages: number = 0;  // Nombre total de pages
  showModal: boolean = false;
  selectedGardien: Gardien | null = null;
  rfidCardNumber: string = '';
  errorMessage: string = '';
  socket: any;
  serverError: any;
  showSuccessModal: boolean = false;
  successModalMessage: string = ''; // Pour les messages de succès
  confirmationAction: string = ''; // Action à confirmer (bloquer ou débloquer)
  showConfirmationModal: boolean = false; // Pour le modal de confirmation

  pagesToDisplay: number[] = [];



  constructor(private pointageService: PointageService, private webSocketService: WebSocketService) {}

  ngOnInit(): void {
    this.loadAllGardiens();
  
    this.webSocketService.receiveRFIDStatus().subscribe((status: { message: string }) => {
      console.log('Statut du RFID:', status.message);
    });
  
    this.socket = this.webSocketService.getSocket();
    this.socket.on('rfid-scanned', (data: RFIDData) => {
      if (data && data.cardId) {
        this.rfidCardNumber = data.cardId;  // Mise à jour de la carte RFID scannée
        console.log('Carte RFID scannée:', this.rfidCardNumber);
      } else {
        this.errorMessage = 'Format de carte RFID invalide';
        console.error(this.errorMessage);
      }
    });
  }
  



 
  loadAllGardiens(): void {
    this.pointageService.getAllGardiens(this.currentPage, this.recordsPerPage).subscribe(
      (data: ApiResponse) => {
        this.gardiens = data.data || [];
        this.totalPages = data.totalPages; // ✅ Corrigé ici
      },
      error => {
        console.error('Erreur lors de la récupération des gardiens', error);
        this.errorMessage = 'Erreur lors de la récupération des gardiens';
      }
    );
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAllGardiens();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadAllGardiens();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadAllGardiens();
    }
  }

  getPagedGardiens(): Gardien[] {
    const startIndex = (this.currentPage - 1) * this.recordsPerPage;
    const endIndex = startIndex + this.recordsPerPage;
    return this.gardiens.slice(startIndex, endIndex);
  }


  openAssignModal(gardien: Gardien): void {
    this.selectedGardien = gardien;
    this.showModal = true;
    console.log('Modal ouvert pour le gardien:', gardien);
  }

 // Fonction qui est appelée lors de la tentative d'assignation de la carte RFID
confirmAssignRFID(): void {
  if (this.selectedGardien && this.rfidCardNumber) {
    if (this.validateRFID(this.rfidCardNumber)) {
      console.log('Assignation de la carte RFID:', this.rfidCardNumber, 'au gardien:', this.selectedGardien);
      this.assignRFID(this.rfidCardNumber, this.selectedGardien._id, `${this.selectedGardien.prenom} ${this.selectedGardien.nom}`);
    } else {
      this.errorMessage = 'Numéro de carte RFID invalide';
    }
  } else {
    this.errorMessage = 'Numéro de carte RFID ou gardien non sélectionné';
    console.error(this.errorMessage);
  }
}

// Validation basique du numéro RFID
validateRFID(rfid: string): boolean {
  return rfid.length > 0; // Vérifie que le numéro n'est pas vide
}

// Fonction pour assigner la carte RFID
assignRFID(carte_rfid: string, guard_id: string, name: string): void {
  console.log("Données envoyées:", { carte_rfid, guard_id, name }); // Affiche les données envoyées
  this.pointageService.assignRFID(carte_rfid, guard_id).subscribe(
    data => {
      console.log('Carte RFID assignée avec succès', data);
      
      // Affiche le message de succès
      this.openSuccessModal('Carte RFID assignée avec succès');
      
      // Recharger la liste des gardiens après succès
      this.loadAllGardiens(); 

      // Fermer le modal après un succès
      this.closeModal();  // Ferme le modal

    },
    error => {
      // Ne pas fermer le modal en cas d'erreur, simplement afficher l'erreur
      this.errorMessage = error.message || 'Erreur lors de l\'assignation de la carte RFID';
      console.error('Erreur lors de l\'assignation de la carte RFID', error);
    }
  );
}

// Ouvrir le modal de succès avec le message approprié
openSuccessModal(message: string): void {
  this.successModalMessage = message;
  this.showSuccessModal = true;
  this.serverError = null; // Réinitialiser les erreurs du serveur

  setTimeout(() => {
    this.closeSuccessModal();
  }, 2000); // Ferme automatiquement le modal de succès après 2 secondes
}

// Fermer le modal de succès
closeSuccessModal(): void {
  this.showSuccessModal = false;
}

// Fonction qui ferme le modal principal (le modal de l'assignation de carte RFID)
closeModal(): void {
  this.showModal = false;
  this.selectedGardien = null;
  this.rfidCardNumber = '';
  this.errorMessage = ''; // Réinitialiser le message d'erreur
  console.log('Modal fermé');
}


      // Fonction de blocage de la carte
  blockRFID(gardien: any): void {
    this.showConfirmationModal = true;
    this.confirmationAction = 'bloquer';
    this.selectedGardien = gardien;
    this.showSuccessModal = false;
  }

  // Fonction de déblocage de la carte
  unblockRFID(gardien: any): void {
    this.showConfirmationModal = true;
    this.confirmationAction = 'activer';
    this.selectedGardien = gardien;
    this.showSuccessModal = false;
  }

  confirmAction(confirm: boolean): void {
    if (confirm && this.selectedGardien) {
      if (this.confirmationAction === 'bloquer') {
        this.pointageService.blockRFID(this.selectedGardien._id).subscribe(
          response => {
            console.log('Carte RFID bloquée avec succès', response);
            this.openSuccessModal('Carte RFID bloquée avec succès')
            this.loadAllGardiens();
            this.showConfirmationModal = false;
          },
          error => {
            this.errorMessage = 'Erreur lors du blocage de la carte RFID';
            this.showConfirmationModal = false;
          }
        );
      } else if (this.confirmationAction === 'activer') {
        this.pointageService.unblockRFID(this.selectedGardien._id).subscribe(
          response => {
            this.openSuccessModal('Carte RFID débloquée avec succès');
            this.loadAllGardiens();
            this.showConfirmationModal = false;
          },
          error => {
            this.errorMessage = 'Erreur lors du déblocage de la carte RFID';
            this.showConfirmationModal = false;
          }
        );
      }
    } else {
      this.showConfirmationModal = false;
    }
  }

  // Méthode pour capitaliser la première lettre
  capitalizeFirstLetter(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
 
  
}
