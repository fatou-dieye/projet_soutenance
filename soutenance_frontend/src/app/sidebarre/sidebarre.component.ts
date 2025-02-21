import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
@Component({
  selector: 'app-sidebarre',
  imports: [],
  templateUrl: './sidebarre.component.html',
  styleUrl: './sidebarre.component.css'
})
export class SidebarreComponent implements OnInit {

 
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateActiveLink();
      }
    });
  }

  updateActiveLink(): void {
    const currentRoute = this.router.url.split('?')[0]; // Remove query params if any

    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === currentRoute) {
        link.classList.add('active');
      }
    });
  }
}
