import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import axiosInstance from '../../environements.ts/axios.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router) { }

  login(email: string, telephone: string, mot_passe: string) {
    return axiosInstance.post('/login', { email, telephone, mot_passe })
      .then(response => {
        const user = response.data.user;
        const token = response.data.token;

        // Stocker le token et les informations utilisateur
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Rediriger en fonction du rôle
        if (user.role === 'administrateur') {
          this.router.navigate(['/dasbordadmin']);
        } else {
          this.router.navigate(['/dashboardutilisateur']);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la connexion:', error);
        throw error;
      });
  }



  checkExistence(email: string, telephone: string) {
    return axiosInstance.post('/check-existence', { email, telephone })
      .then(response => {
        return response.data;
      })
      .catch(error => {
        console.error('Erreur lors de la vérification de l\'email ou du téléphone:', error);
        throw error;
      });
  }



  logout() {
    const token = localStorage.getItem('token');
      // Assurez-vous que le token est récupéré correctement.
  
    return axiosInstance.post('/logout', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(() => {
      console.log('Déconnexion réussie');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    })
    .catch(error => {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    });
  }
}
