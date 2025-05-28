import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import axiosInstance from '../../../environnement/axios';

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
        } else if(user.role === 'utilisateur') {
          this.router.navigate(['/dashboardutilisateur']);
        }
        else{
          this.router.navigate(['/login']);

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

  requestResetPassword(email: string) {
    return axiosInstance.post('/request-reset-password', { email })
      .then(response => {
        console.log('Email de réinitialisation envoyé:', response.data.message);
        return response.data;
      })
      .catch(error => {
        console.error('Erreur lors de la demande de réinitialisation:', error);
        throw error;
      });
  }

   

  resetPassword(token: string, newPassword: string, confirmPassword: string) {
    return axiosInstance.post(`/reset-password?token=${token}`, { newPassword, confirmPassword })
      .then(response => {
        console.log('Mot de passe réinitialisé:', response.data.message);
        return response.data;
      })
      .catch(error => {
        console.error('Erreur lors de la réinitialisation du mot de passe:', error);
        throw error;
      });
  }

   // Vérifier si l'utilisateur est connecté
   isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Récupérer l'utilisateur connecté
  getCurrentUser(): any {
    const user = localStorage.getItem('user');
    
    return user ? JSON.parse(user) : null;
  }


    
  // Méthode pour changer le mot de passe (convertie pour utiliser axios)
  changePassword(passwordData: {
    ancien_mot_passe: string,
    nouveau_mot_passe: string,
    confirmation_mot_passe: string
  }) {
    const token = localStorage.getItem('token');
    
    return axiosInstance.put('/change-password', passwordData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    });
  }
  
  // Méthode pour récupérer l'historique de l'utilisateur (convertie pour utiliser axios)
  getHistoriqueUtilisateur() {
    const token = localStorage.getItem('token');
    
    return axiosInstance.get('/historique-utilisateur', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    });
  }
  
  // Méthode pour vérifier si l'ancien mot de passe est correct (convertie pour utiliser axios)
  verifyOldPassword(ancienMotPasse: string) {
    const token = localStorage.getItem('token');
    
    // Utilisation de "oldPassword" comme clé, qui est attendue côté backend
    const body = {
      oldPassword: ancienMotPasse
    };
    
    return axiosInstance.post('/verify-old-password', body, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error('Erreur lors de la vérification de l\'ancien mot de passe:', error);
      throw error;
    });
  }
  
 
}
