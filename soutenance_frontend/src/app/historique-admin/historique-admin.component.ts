
import { Component , OnInit} from '@angular/core';
import { AuthService } from '../services/serviceslogin/auth.service';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-historique-admin',
  standalone: true, 
  imports: [ CommonModule, FormsModule],
  providers: [DatePipe], 
  templateUrl: './historique-admin.component.html',
  styleUrl: './historique-admin.component.css'
})
export class HistoriqueAdminComponent implements OnInit {
  historique: any[] = [];
  filteredHistorique: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalPages: number = 1;
  searchQuery: string = ''; // Variable pour la recherche
  selectedDate: string = ''; // Variable pour le filtre de date

  constructor(private historiqueService: AuthService, private datePipe: DatePipe) {}

  ngOnInit(): void {
    // Récupérer l'historique de l'utilisateur connecté
    this.historiqueService.getHistoriqueUtilisateur()
      .then((data) => {
        this.historique = data; // Stocker les données d'historique
        this.filteredHistorique = data; // Initialement tous les éléments sont affichés
        this.totalPages = Math.ceil(this.filteredHistorique.length / this.itemsPerPage); // Calculer le nombre total de pages
        console.log('Historique récupéré :', this.historique);
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération de l\'historique :', error);
      });
  }
  // Fonction pour changer de page
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;  // Si la page est hors des limites
    this.currentPage = page;
  }

  // Récupérer les historiques à afficher pour la page actuelle
  getPagedHistorique(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredHistorique.slice(startIndex, endIndex);
  }

  // Fonction pour filtrer par recherche
  filterBySearch(): void {
    this.filteredHistorique = this.historique.filter(item => 
      item.action.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    this.totalPages = Math.ceil(this.filteredHistorique.length / this.itemsPerPage);
    this.currentPage = 1;  // Réinitialiser à la première page après une recherche
  }

  // Fonction pour filtrer par date
  filterByDate(): void {
    if (this.selectedDate) {
      this.filteredHistorique = this.historique.filter(item => {
        // Comparer la date sous forme de chaîne sans l'heure
        const itemDate = this.datePipe.transform(item.date, 'yyyy-MM-dd');
        return itemDate === this.selectedDate;
      });
    } else {
      this.filteredHistorique = this.historique;
    }
    this.totalPages = Math.ceil(this.filteredHistorique.length / this.itemsPerPage);
    this.currentPage = 1;  // Réinitialiser à la première page après un filtre par date
  }
}