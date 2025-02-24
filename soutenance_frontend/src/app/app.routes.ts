import { Routes } from '@angular/router';
import { DasbordadminComponent } from './dasbordadmin/dasbordadmin.component';
import { SidebarreComponent } from './sidebarre/sidebarre.component';
import { LogiComponent } from './logi/logi.component';
export const routes: Routes = [
    
    { path: 'logi', component: LogiComponent },
    { path: 'dasbordadmin', component: DasbordadminComponent },
    { path: 'sidebarre', component: SidebarreComponent },
    { path: '', redirectTo: '/logi', pathMatch: 'full' } 


];
