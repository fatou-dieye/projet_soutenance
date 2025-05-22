import { Component, OnInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';

import { GestionpersonnelService, User } from '../services/gestionpersonnel-services/gestionpersonnel.service';

import { AuthService } from '../services/serviceslogin/auth.service';
import { ChangementMotsPassComponent } from '../changement-mots-pass/changement-mots-pass.component';
import { isPlatformBrowser, CommonModule } from '@angular/common';



@Component({
  selector: 'app-sidebarre',
  imports: [RouterModule, CommonModule, ChangementMotsPassComponent ],

  templateUrl: './sidebarre.component.html',
  styleUrl: './sidebarre.component.css'
})
export class SidebarreComponent implements OnInit {
 @ViewChild(ChangementMotsPassComponent) passwordModal!: ChangementMotsPassComponent;
  currentUser: any;
  users: User[] = [];
  filteredUsers: User[] = [];
 
  isAdmin: boolean = false;
  userName: string = '';
  userPrenom: string = '';
  userRole: string = '';
  userPhoto: string | null = null; // Initialisez à null directement

  constructor(private authService: AuthService, private router: Router ,
    private GestionpersonnelService: GestionpersonnelService, 
     @Inject(PLATFORM_ID) private platformId: Object 
  ) {}

  ngOnInit(): void {
    // Récupérer les informations de l'utilisateur depuis le localStorage
     if (isPlatformBrowser(this.platformId)) {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      this.userPrenom = userData.prenom;
      this.userName = userData.nom;
      this.userPhoto = userData.photo || null;
      this.isAdmin = userData.role === 'administrateur';
      this.userRole = this.isAdmin ? 'Administrateur' : 'Utilisateur';
      this.currentUser = userData;
    }
    }

   
  // S'abonner aux événements de navigation pour mettre à jour les liens actifs
  this.router.events.subscribe(event => {
    if (event instanceof NavigationEnd) {
      this.updateActiveLink();
    }
  });

  if (!this.authService.isLoggedIn()) {
    this.router.navigate(['/login']);
    return;
  }
  
  // Ne charger les utilisateurs que si l'utilisateur est un administrateur
  if (this.isAdmin) {
    this.loadUsers();
  }

  // Rediriger vers le dashboard approprié SEULEMENT si l'utilisateur est sur la page d'accueil ou login
  if (this.router.url === '/' || this.router.url === '/login') {
    this.redirectToDashboard();
  }
  }

  redirectToDashboard(): void {
    if (this.isAdmin) {
      this.router.navigate(['/dasbordadmin']);
    } else {
      this.router.navigate(['/dashboardutilisateur']);
    }
  }
 loadUsers(): void {
  this.GestionpersonnelService.getAllUsers().subscribe({
    next: (data) => {
      this.users = data.filter(user =>
        ['administrateur', 'utilisateur'].includes(user.role)
      );
      this.filteredUsers = [...this.users];
    },
    error: (error) => {
      console.error('Error fetching users:', error);
      
      if (error.status === 401 && isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
      }
    }
  });
}

 updateActiveLink(): void {
  if (!isPlatformBrowser(this.platformId)) {
    return;
  }

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
  openPasswordChangeModal(): void {
    if (this.passwordModal) {
      this.passwordModal.openModal();
    }
  }
}
