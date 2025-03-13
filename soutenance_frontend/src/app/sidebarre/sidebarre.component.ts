import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';
import { GestionpersonnelService, User } from '../services/gestionpersonnel-services/gestionpersonnel.service';

import { AuthService } from '../services/serviceslogin/auth.service';
import { ChangementMotsPassComponent } from '../changement-mots-pass/changement-mots-pass.component';
@Component({
  selector: 'app-sidebarre',
  imports: [RouterModule, ChangementMotsPassComponent],
  templateUrl: './sidebarre.component.html',
  styleUrl: './sidebarre.component.css'
})
export class SidebarreComponent implements OnInit {
 @ViewChild(ChangementMotsPassComponent) passwordModal!: ChangementMotsPassComponent;
  currentUser: any;
  users: User[] = [];
  filteredUsers: User[] = [];
  constructor(private router: Router,
    private AuthService: AuthService,
    private GestionpersonnelService: GestionpersonnelService, 
  ) {}

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateActiveLink();
      }
    });

    if (!this.AuthService.isLoggedIn()) {
      this.router.navigate(['/logi']);
      return;
    }
    
    // Get current user
    this.currentUser = this.AuthService.getCurrentUser();
    
    // Check if user has required role
    if (this.currentUser && this.currentUser.role === 'administrateur') {
      this.loadUsers();
    } else {
      // Redirect if not admin
      this.router.navigate(['/unauthorized']);
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
        
        // If unauthorized, token might be expired or invalid
        if (error.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.router.navigate(['/logi']);
        }
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

  logout(): void {
    this.AuthService.logout().subscribe({
      next: () => {
        this.router.navigate(['/logi']);
      },
      error: () => {
        // Even if logout fails on server, clear local storage and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.router.navigate(['/logi']);
      }
    });
  }

  openPasswordChangeModal(): void {
    if (this.passwordModal) {
      this.passwordModal.openModal();
    }
  }
}
