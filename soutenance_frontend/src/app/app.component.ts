import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Ajoutez uniquement Router, pas ActivatedRoute ici
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { GestionPersonelsComponent } from './gestion-personels/gestion-personels.component';
import { SidebarreComponent } from './sidebarre/sidebarre.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FormsModule, SidebarreComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'soutenance_frontend';
  isSidebarOpen = false;

  constructor(private router: Router) {}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  // Méthode pour vérifier si la route actuelle est l'une des pages sans sidebar
  shouldShowSidebar(): boolean {
    const currentRoute = this.router.url.split('?')[0];  // Ignore les paramètres de requête

    // Liste des routes où le sidebar ne doit pas s'afficher
    const noSidebarRoutes = [
      '/login', 
      '/inscriptionutilisateur', 
      '/reset-password',
      '/forgetpassword'
    ];

    return !noSidebarRoutes.includes(currentRoute);
  }
}
