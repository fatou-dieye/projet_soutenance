import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'protected',
    loadComponent: () => import('./components/protected/protected.component')
      .then(m => m.ProtectedComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard-admin',
    loadComponent: () => import('./components/dashboard-admin/dashboard-admin.component')
      .then(m => m.DashboardAdminComponent),
    canActivate: [AuthGuard, AdminGuard],
    children: [
      {
        path: 'gestion-utilisateur',
        loadComponent: () => import('./components/gestion-utilisateur/gestion-utilisateur.component')
          .then(m => m.GestionUtilisateurComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard-admin',
        pathMatch: 'full'
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];