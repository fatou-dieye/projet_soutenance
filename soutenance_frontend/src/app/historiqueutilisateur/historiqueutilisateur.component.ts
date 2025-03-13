import { Component, OnInit } from '@angular/core';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';
import { UtilisateurService } from '../services/utilisateur.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historiqueutilisateur',
  imports: [SidebarreComponent, CommonModule],
  templateUrl: './historiqueutilisateur.component.html',
  styleUrls: ['./historiqueutilisateur.component.css']
})
export class HistoriqueutilisateurComponent implements OnInit {
  historique: any[] = [];
  page: number = 1; // Page actuelle
  size: number = 10; // Nombre d'éléments par page
  totalItems: number = 0; // Nombre total d'éléments
  paginatedHistorique: any[] = []; // Historique paginé affiché dans la table

  userPrenom: string = '';
  userName: string = '';

  constructor(private utilisateurService: UtilisateurService) { }

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      this.userPrenom = userData.prenom;
      this.userName = userData.nom;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token manquant dans localStorage');
      return;
    }

    // Charger l'historique avec pagination
    this.loadHistorique();
  }

  loadHistorique(): void {
    this.utilisateurService.getHistoriqueUtilisateur()
      .then(data => {
        this.historique = data;
        this.totalItems = data.length;
        this.paginateHistorique();  // Appliquer la pagination après la récupération des données
      })
      .catch(error => {
        console.error('Erreur lors de la récupération de l\'historique :', error);
      });
  }

  paginateHistorique(): void {
    // Calculer les éléments à afficher sur la page actuelle
    const startIndex = (this.page - 1) * this.size;
    const endIndex = startIndex + this.size;
    this.paginatedHistorique = this.historique.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page < 1 || page > Math.ceil(this.totalItems / this.size)) {
      return; // Si la page est hors de portée, on ne change pas la page
    }
    this.page = page;
    this.paginateHistorique(); // Recalculer les éléments à afficher
  }

  getDateAndTime(date: string): { date: string, time: string } {
    if (!date) {
      console.warn('Date non définie pour l\'entrée:', date);
      return { date: '', time: '' };
    }

    const [datePart, timePart] = date.split('T');
    return { 
      date: datePart, 
      time: timePart ? timePart.split('.')[0] : '' 
    };
  }
}
