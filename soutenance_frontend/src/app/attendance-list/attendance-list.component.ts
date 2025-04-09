import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PointageService } from '../services/pointage.service';
import { WebSocketService } from '../services/websocket.service';

// Définition du modèle de données pour un pointage (Record)
interface Record {
  carte_rfid: string;
  guard_id: string;
  name?: string;  // Peut être vide ou manquant dans la réponse
  date?: string;
  check_in_time?: string;
  check_out_time?: string;
  status?: string;
  location?: string;
}

@Component({
  selector: 'app-attendance-list',
  imports: [ CommonModule, ReactiveFormsModule],
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.css'
})
export class AttendanceListComponent implements OnInit {
  records: Record[] = [];  // Tableau des enregistrements de pointage
  selectedDate: string = new Date().toISOString().split('T')[0];  // Date sélectionnée, formatée
  attendanceForm: FormGroup;  // Formulaire pour la gestion des pointages

  constructor(private pointageService: PointageService, private fb: FormBuilder, private websocketService: WebSocketService) {
    this.attendanceForm = this.fb.group({
      guard_id: [''],
      name: [''],
      date: [''],
      location: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
    // Charger les pointages pour la date sélectionnée
    this.loadAttendance(this.selectedDate);
  
    // Écouter la réponse du serveur pour afficher les données de pointage dans le tableau
    this.websocketService.receiveRFIDStatus().subscribe(
      (response) => {
        console.log('Réponse du serveur pour le pointage:', response);
  
        // Vérification de la structure de la réponse
        if (response.message === "Pointage enregistré avec succès pour le gardien") {
          // Ajouter l'enregistrement dans le tableau des pointages
          const newRecord: Record = response.data;  // Typage de l'objet attendu

          // Vérification que les données essentielles sont présentes
          if (newRecord && newRecord.carte_rfid && newRecord.guard_id) {
            // Si certains champs manquent, on peut leur attribuer des valeurs par défaut ou gérer l'absence
            newRecord.name = newRecord.name || 'Inconnu';
            newRecord.date = newRecord.date || this.selectedDate;
            newRecord.check_in_time = newRecord.check_in_time || '00:00'; // Valeur par défaut
            newRecord.check_out_time = newRecord.check_out_time || '00:00'; // Valeur par défaut

            // Ajouter l'enregistrement au tableau
            this.records.push(newRecord);
            console.log('Nouveau pointage ajouté:', newRecord);
          } else {
            console.error('Données de pointage invalides ou incomplètes:', newRecord);
          }
        } else {
          console.error('Erreur lors du pointage:', response.message);
        }
      },
      (error) => {
        console.error('Erreur de connexion ou de traitement:', error);
      }
    );
  }
  

  // Fonction pour récupérer les pointages de la journée
  loadAttendance(date: string): void {
    this.pointageService.getAttendanceByDate(date).subscribe(
      (response) => {
        this.records = response.data.records;  // Chargement des pointages depuis le service
      },
      (error) => {
        console.error('Erreur lors de la récupération des enregistrements:', error);
      }
    );
  }

  onDateChange(event: any): void {
    // Gestion du changement de date
    console.log('Date sélectionnée:', event.target.value);
    this.selectedDate = event.target.value;
    this.loadAttendance(this.selectedDate);  // Recharger les pointages pour la nouvelle date
  }

  
}