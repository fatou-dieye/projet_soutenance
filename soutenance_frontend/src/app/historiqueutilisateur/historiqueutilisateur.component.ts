import { Component, OnInit } from '@angular/core';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';
import { UtilisateurService } from '../services/utilisateur.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historiqueutilisateur',
  imports: [SidebarreComponent, CommonModule ],
  templateUrl: './historiqueutilisateur.component.html',
  styleUrl: './historiqueutilisateur.component.css'
})
export class HistoriqueutilisateurComponent implements OnInit {
  historique: any[] = [];

  constructor(private utilisateurService: UtilisateurService) { }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    console.log('Token in component:', token); // Log the token
    if (!token) {
      console.error('Token manquant dans localStorage');
      // Optionally redirect or show an error message to the user
      return;
    }

    this.utilisateurService.getHistoriqueUtilisateur()
      .then(data => {
        console.log('Historique récupéré :', data);
        this.historique = data;
      })
      .catch(error => {
        console.error('Erreur lors de la récupération de l\'historique :', error);
      });
  }
}