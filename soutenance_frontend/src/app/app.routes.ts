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
import { AjouterPersonnelsComponent } from './ajouter-personels/ajouter-personels.component';

export const routes: Routes = [
    
    { path: 'login', component: LoginComponent },
    { path: 'dasbordadmin', component: DasbordadminComponent },

    { path: 'alerte-poubelle', component: AlertePoubelleComponent  },
    { path: 'gestion-des-signaux', component: GestionDesSignauxComponent },
    { path: 'historique-admin', component: HistoriqueAdminComponent },
    { path: 'dashboardutilisateur', component: DashboardutilisateurComponent },
    { path: 'historiqueutilisateur', component: HistoriqueutilisateurComponent },
    { path: 'pointage', component: PointageComponent },
    { path: 'inscriptionutilisateur', component: InscriptionutilisateurComponent },
   
    { path: 'forgetpassword', component: ForgetpasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'gestion-personels', component: GestionPersonelsComponent },
    { path: 'gestion-des-signeau-citoyen', component:  GestionDesSigneauCitoyenComponent },
    { path: 'ajouter-personels', component: AjouterPersonnelsComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' } 



];
