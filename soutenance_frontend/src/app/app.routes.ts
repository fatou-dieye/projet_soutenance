//app.routes.ts
import { Routes } from '@angular/router';
import { DasbordadminComponent } from './dasbordadmin/dasbordadmin.component';
import { SidebarreComponent } from './sidebarre/sidebarre.component';
import { LoginComponent } from './login/login.component';
import { GestionDesSignauxComponent } from './gestion-des-signaux/gestion-des-signaux.component';
import { GestionPersonelsComponent } from './gestion-personels/gestion-personels.component';
import { HistoriqueAdminComponent } from './historique-admin/historique-admin.component';
import { DashboardutilisateurComponent } from './dashboardutilisateur/dashboardutilisateur.component';
import { HistoriqueutilisateurComponent } from './historiqueutilisateur/historiqueutilisateur.component';
import { PointageComponent } from './pointage/pointage.component';
import { InscriptionutilisateurComponent } from './inscriptionutilisateur/inscriptionutilisateur.component';

export const routes: Routes = [
    
    { path: 'login', component: LoginComponent },
    { path: 'dasbordadmin', component: DasbordadminComponent },
    { path: 'gestion-des-signaux', component: GestionDesSignauxComponent },
    { path: 'gestion-personels', component: GestionPersonelsComponent },
    { path: 'historique-admin', component: HistoriqueAdminComponent },
    { path: 'dashboardutilisateur', component: DashboardutilisateurComponent },
    { path: 'historiqueutilisateur', component: HistoriqueutilisateurComponent },
    { path: 'pointage', component: PointageComponent },
    { path: 'inscriptionutilisateur', component: InscriptionutilisateurComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' } 


];
