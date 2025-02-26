
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarreComponent } from '../sidebarre/sidebarre.component';

import { FormsModule } from '@angular/forms';
import { GestionpersonnelService } from '../gestionpersonnel-services/gestionpersonnel.service';
@Component({
  selector: 'app-gestion-personels',
  imports: [SidebarreComponent],
  templateUrl: './gestion-personels.component.html',
  styleUrl: './gestion-personels.component.css'
})
export class GestionPersonelsComponent {

}
