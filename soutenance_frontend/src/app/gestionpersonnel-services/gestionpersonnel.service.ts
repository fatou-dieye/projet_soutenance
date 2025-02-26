import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  statut: string;
  photo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GestionpersonnelService {

  private apiUrl = 'http://localhost:3000/api'; // Adjust your API URL as needed

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }
  
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }
  
  updateUserStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${id}/status`, { statut: status });
  }
}
