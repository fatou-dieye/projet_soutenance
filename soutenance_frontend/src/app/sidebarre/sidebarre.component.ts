import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // Importez le CommonModule
import { AuthService } from '../services/auth.service';
@Component({
  selector: 'app-sidebarre',
  imports: [RouterModule, CommonModule ],
  templateUrl: './sidebarre.component.html',
  styleUrl: './sidebarre.component.css'
})
export class SidebarreComponent implements OnInit {
  isAdmin: boolean = false;
  userName: string = '';
  userPrenom: string = '';
  userRole: string = '';
  userPhoto: string | null = null; // Initialisez à null directement

  constructor(private authService: AuthService, private router: Router ) {}

  ngOnInit(): void {
    // Récupérer les informations de l'utilisateur depuis le localStorage
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      this.userPrenom = userData.prenom;
      this.userName = userData.nom;
      this.userPhoto = null;
      this.isAdmin = userData.role === 'administrateur';
      this.userRole = this.isAdmin ? 'Administrateur' : 'Utilisateur';
    }

    // S'abonner aux événements de navigation pour mettre à jour les liens actifs
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateActiveLink();
      }
    });
  }

  updateActiveLink(): void {
    const currentRoute = this.router.url.split('?')[0];
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === currentRoute) {
        link.classList.add('active');
      }
    });
  }

  getInitials(): string {
    return this.userPrenom.charAt(0).toUpperCase() + this.userName.charAt(0).toUpperCase();
  }

  getBackgroundColor(): string {
    // Générer une couleur de fond aléatoire ou basée sur les initiales
    const colors = ['#00A551', '#33FF57',  '#FF33F6'];
    const hash = this.userPrenom.charCodeAt(0) + this.userName.charCodeAt(0);
    return colors[hash % colors.length];
  }


   // Méthode pour appeler la déconnexion
   logout() {
    this.authService.logout()
      .then(() => {
        // L'utilisateur est déconnecté, vous pouvez effectuer d'autres actions si nécessaire
      })
      .catch(error => {
        console.error('Erreur lors de la déconnexion:', error);
      });
}

}