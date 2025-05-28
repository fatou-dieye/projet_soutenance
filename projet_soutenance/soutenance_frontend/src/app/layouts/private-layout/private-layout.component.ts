import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // ✅ À ajouter
import { SidebarreComponent } from '../../sidebarre/sidebarre.component';
@Component({
  selector: 'app-private-layout',
  imports: [RouterModule,SidebarreComponent ],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.css'
})
export class PrivateLayoutComponent {

}
