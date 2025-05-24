//app.routes.ts
import { Routes } from '@angular/router';
import { DasbordadminComponent } from './dasbordadmin/dasbordadmin.component';


import { AlertePoubelleComponent } from './alerte-poubelle/alerte-poubelle.component';

import { GestionDesSigneauCitoyenComponent } from './gestion-des-signeau-citoyen/gestion-des-signeau-citoyen.component';
import { LoginComponent } from './login/login.component';
import { GestionDesSignauxComponent } from './gestion-des-signaux/gestion-des-signaux.component';
import { HistoriqueAdminComponent } from './historique-admin/historique-admin.component';
import { DashboardutilisateurComponent } from './dashboardutilisateur/dashboardutilisateur.component';
import { HistoriqueutilisateurComponent } from './historiqueutilisateur/historiqueutilisateur.component';
import { PointageComponent } from './pointage/pointage.component';
import { InscriptionutilisateurComponent } from './inscriptionutilisateur/inscriptionutilisateur.component';
import { ForgetpasswordComponent } from './forgetpassword/forgetpassword.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { GestionPersonelsComponent } from './gestion-personels/gestion-personels.component';
import { AttendanceListComponent } from './attendance-list/attendance-list.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { PrivateLayoutComponent } from './layouts/private-layout/private-layout.component';
import { AuthGuard } from './guards/auth.guard'; // À créer

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'inscriptionutilisateur', component: InscriptionutilisateurComponent },
      { path: 'forgetpassword', component: ForgetpasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent }
    ]
  },
  {
    path: '',
    component: PrivateLayoutComponent,
    canActivateChild: [AuthGuard],
    children: [
      { path: 'dashboardutilisateur', component: DashboardutilisateurComponent },
      { path: 'dasbordadmin', component: DasbordadminComponent },
      { path: 'gestion-des-signeau-citoyen', component: GestionDesSigneauCitoyenComponent },
      { path: 'historiqueutilisateur', component: HistoriqueutilisateurComponent },
      { path: 'gestion-des-signaux', component: GestionDesSignauxComponent },
      { path: 'historique-admin', component: HistoriqueAdminComponent },
      { path: 'pointage', component: PointageComponent },
      { path: 'gestion-personels', component: GestionPersonelsComponent },
      { path: 'attendance-list', component: AttendanceListComponent },
      { path: 'alerte-poubelle', component: AlertePoubelleComponent }
    ]
  },
  {
     path: '**', redirectTo: 'login' }
];
