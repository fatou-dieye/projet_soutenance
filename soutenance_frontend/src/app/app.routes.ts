//app.routes.ts
import { Routes } from '@angular/router';
import { DasbordadminComponent } from './dasbordadmin/dasbordadmin.component';
import { SidebarreComponent } from './sidebarre/sidebarre.component';
import { LogiComponent } from './login/logi.component';
import { GestionDesSignauxComponent } from './gestion-des-signaux/gestion-des-signaux.component';
import { GestionPersonelsComponent } from './gestion-personels/gestion-personels.component';
import { HistoriqueAdminComponent } from './historique-admin/historique-admin.component';
export const routes: Routes = [
    
    { path: 'logi', component: LogiComponent },
    { path: 'dasbordadmin', component: DasbordadminComponent },
    { path: 'gestion-des-signaux', component: GestionDesSignauxComponent },
    { path: 'gestion-personels', component: GestionPersonelsComponent },
    { path: 'historique-admin', component: HistoriqueAdminComponent },
    { path: '', redirectTo: '/logi', pathMatch: 'full' } 


];
