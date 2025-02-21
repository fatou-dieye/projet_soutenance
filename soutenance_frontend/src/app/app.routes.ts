import { Routes } from '@angular/router';
import { DasbordadminComponent } from './dasbordadmin/dasbordadmin.component';
import { SidebarreComponent } from './sidebarre/sidebarre.component';

export const routes: Routes = [
    
    { path: 'dasbordadmin', component: DasbordadminComponent },
    { path: 'sidebarre', component: SidebarreComponent },
    { path: '', redirectTo: '/dasbordadmin', pathMatch: 'full' } 


];
