import { Component, Input } from '@angular/core';

import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-message-succes',
  imports: [CommonModule],
  templateUrl: './message-succes.component.html',
  styleUrl: './message-succes.component.css'
})
export class MessageSuccesComponent {
  @Input() showSuccessModal: boolean = false;
  @Input() successModalMessage: string = '';
}
