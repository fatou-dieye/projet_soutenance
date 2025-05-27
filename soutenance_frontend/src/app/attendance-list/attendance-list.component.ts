import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PointageService } from '../services/pointage.service';
import { WebSocketService } from '../services/websocket.service';
import { AlertModalComponent } from '../alertemodale/alertemodale.component';
import { FormsModule } from '@angular/forms';
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
 imports: [CommonModule, ReactiveFormsModule,  AlertModalComponent,  FormsModule],
 templateUrl: './attendance-list.component.html',
 styleUrls: ['./attendance-list.component.css'] // Notez le pluriel ici: styleUrls
})
export class AttendanceListComponent implements OnInit {
 records: Record[] = [];  // Tableau des enregistrements de pointage
 selectedDate: string = '';  // Date sélectionnée, formatée
 attendanceForm: FormGroup;  // Formulaire pour la gestion des pointages


 // Pagination
 currentPage: number = 1;  // Page actuelle
 totalPages: number = 1;  // Nombre total de pages
 recordsPerPage: number = 8;  // Nombre d'enregistrements à afficher par page


 constructor(
   private pointageService: PointageService,
   private fb: FormBuilder,
   private websocketService: WebSocketService
 ) {
   this.attendanceForm = this.fb.group({
     guard_id: [''],
     name: [''],
     date: [''],
     location: [''],
     status: ['']
   });
 } ngOnInit(): void {
   // Charger les pointages pour la date sélectionnée
   const today = new Date(); // ← Déclaration correcte de today
 this.selectedDate = today.toISOString().split('T')[0];


 this.loadAttendance(this.selectedDate); // Charger les pointages du jour


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
           this.updatePagination();  // Mettre à jour la pagination après ajout d'un record


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
       // Vérification que la réponse contient bien des records
       if (response && response.data && Array.isArray(response.data.records)) {
         this.records = response.data.records;  // Chargement des pointages depuis le service
         this.updatePagination();  // Mettre à jour la pagination après avoir chargé les records
       } else {
         this.records = [];  // S'assurer que records est toujours un tableau valide
         console.error('Aucun enregistrement trouvé ou réponse invalide');
       }
     },
     (error) => {
       console.error('Erreur lors de la récupération des enregistrements:', error);
       this.records = [];  // S'assurer que records est toujours un tableau vide en cas d'erreur
     }
   );
 }


 // Fonction pour récupérer tous les enregistrements de pointage
 loadAttendanceRecords(): void {
   this.pointageService.getAttendanceRecords().subscribe(
     (response) => {
      
       // Vérification que response.data est un tableau
       if (response && Array.isArray(response.data)) {
         this.records = response.data;  // Charger les enregistrements si validé
         this.updatePagination();  // Mettre à jour la pagination
       } else {
         this.records = [];  // S'assurer que records est toujours un tableau
         console.error('Aucun enregistrement trouvé ou réponse invalide');
       }
     },
     (error) => {
       console.error('Erreur lors de la récupération des enregistrements:', error);
       this.records = [];  // S'assurer que records est toujours un tableau vide en cas d'erreur
     }
   );
 }


 // Mettre à jour les informations de la pagination
 updatePagination(): void {
   if (Array.isArray(this.records)) {
     this.totalPages = Math.ceil(this.records.length / this.recordsPerPage);  // Calculer le nombre total de pages
     this.currentPage = 1;  // Revenir à la première page lorsque les données sont mises à jour
   } else {
     console.error('Records ne sont pas un tableau valide');
     this.totalPages = 1;
     this.currentPage = 1;
   }
 }


 // Navigation vers la page précédente
 prevPage(): void {
   if (this.currentPage > 1) {
     this.currentPage--;
   }
 }


 // Navigation vers la page suivante
 nextPage(): void {
   if (this.currentPage < this.totalPages) {
     this.currentPage++;
   }
 }


 // Aller à une page spécifique
 goToPage(page: number): void {
   if (page >= 1 && page <= this.totalPages) {
     this.currentPage = page;
   }
 }


 // Récupérer les records de la page actuelle
 getPagedRecords(): Record[] {
   const startIndex = (this.currentPage - 1) * this.recordsPerPage;
   const endIndex = startIndex + this.recordsPerPage;
   return this.records.slice(startIndex, endIndex);  // Retourner les records pour la page actuelle
 }


 // Gestion du changement de date
onDateChange(event: any): void {
 const selected = event.target.value;
 console.log('Date sélectionnée:', selected);


 this.selectedDate = selected;


 if (selected) {
   this.loadAttendance(this.selectedDate);  // Charger pour une date spécifique
 } else {
   this.loadAttendanceRecords();  // Si la date est effacée
 }
}


}
