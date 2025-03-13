import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axiosInstance from '../../../environnement/axios';
export interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  statut: string;
  photo?: string;

  mot_passe?: string;
  adresse: string;
}
export interface NewUser {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  role: string;
  statut?: string;
  photo?: File | string; 
  mot_passe?: string;
}


@Injectable({
  providedIn: 'root'
})
export class GestionpersonnelService {
  constructor() { }

// Récupérer tous les utilisateurs
  getAllUsers(): Observable<User[]> {
    return new Observable((observer) => {
      axiosInstance.get('/users')
        .then((response) => {
          observer.next(response.data); // Retourner les données des utilisateurs
          observer.complete();
        })
        .catch((error) => {
          observer.error(error); // Retourner l'erreur
        });
    });
  }

  // Récupé  rer un utilisateur par son ID
  getUserById(id: string): Observable<User> {
    return new Observable((observer) => {
      axiosInstance.get(`/users/${id}`)
        .then((response) => {
          observer.next(response.data); // Retourner les données de l'utilisateur
          observer.complete();
        })
        .catch((error) => {
          observer.error(error); // Retourner l'erreur
        });
    });
  }

  // Supprimer un utilisateur
  deleteUser(id: string): Observable<any> {
    return new Observable((observer) => {
      axiosInstance.delete(`/users/${id}`)
        .then((response) => {
          observer.next(response.data); // Retourner la réponse
          observer.complete();
        })
        .catch((error) => {
          observer.error(error); // Retourner l'erreur
        });
    });
  }

  // Bloquer ou débloquer un utilisateur
  toggleUserStatus(id: string): Observable<any> {
    return new Observable((observer) => {
      axiosInstance.put(`/users/${id}/toggle-status`)
        .then((response) => {
          observer.next(response.data); // Retourner la réponse
          observer.complete();
        })
        .catch((error) => {
          observer.error(error); // Retourner l'erreur
        });
    });
  }

  // Supprimer plusieurs utilisateurs
  bulkDeleteUsers(userIds: string[]): Observable<any> {
    return new Observable((observer) => {
      axiosInstance.delete('/users/bulk-delete', { data: { userIds } })
        .then((response) => {
          observer.next(response.data); // Retourner la réponse
          observer.complete();
        })
        .catch((error) => {
          observer.error(error); // Retourner l'erreur
        });
    });
  }

  // Mettre à jour le statut de plusieurs utilisateurs
  updateUsersStatus(userIds: string[], statut: string): Observable<any> {
    return new Observable((observer) => {
      axiosInstance.put('/users/bulk-update-status', { userIds, statut })
        .then((response) => {
          observer.next(response.data); // Retourner la réponse
          observer.complete();
        })
        .catch((error) => {
          observer.error(error); // Retourner l'erreur
        });
    });
  }
    // Méthode pour ajouter un utilisateur avec un fichier (photo)
    addUser(user: NewUser): Observable<any> {
      const formData = new FormData();
      formData.append('nom', user.nom);
      formData.append('prenom', user.prenom);
      formData.append('email', user.email);
      formData.append('telephone', user.telephone);
      formData.append('adresse', user.adresse);
      formData.append('role', user.role);
      formData.append('statut', user.statut || 'active');
    
      if (user.photo instanceof File) {
        formData.append('photo', user.photo, user.photo.name);
      } else if (typeof user.photo === 'string') {
        formData.append('photo', user.photo);
      }
    
      if (user.mot_passe) {
        formData.append('mot_passe', user.mot_passe);
      }
    
      return new Observable((observer) => {
        axiosInstance.post('/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then((response) => {
          observer.next(response.data);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error.response ? error.response.data.message : 'Erreur lors de l\'inscription');
        });
      });
    }
  //modifier un utilisateur
  // Méthode pour mettre à jour un utilisateur sans fichier
updateUser(user: User): Observable<any> {
  return new Observable((observer) => {
    axiosInstance.put(`/users/${user._id}`, user)
      .then((response) => {
        observer.next(response.data);
        observer.complete();
      })
      .catch((error) => {
        observer.error(error);
      });
  });
}

// Méthode pour mettre à jour un utilisateur avec un fichier
updateUserWithFile(user: User, file: File): Observable<any> {
  const formData = new FormData();
  formData.append('photo', file, file.name);
  formData.append('prenom', user.prenom);
  formData.append('nom', user.nom);
  formData.append('email', user.email);
  formData.append('telephone', user.telephone);
  formData.append('adresse', user.adresse);
  formData.append('role', user.role);
  formData.append('statut', user.statut);

  return new Observable((observer) => {
    axiosInstance.put(`/users/${user._id}`, formData)
      .then((response) => {
        observer.next(response.data);
        observer.complete();
      })
      .catch((error) => {
        observer.error(error);
      });
  });
}
}

  

