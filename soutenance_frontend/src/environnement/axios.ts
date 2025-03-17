//environement/axios.ts// src/environments/axios.ts
import axios from 'axios';

// Configurer Axios avec l'URL de l'API et les en-têtes par défaut
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',  // Remplacez par l'URL de votre API
  headers: {
    'Content-Type': 'application/json',
    // Vous pouvez ajouter d'autres en-têtes ici
  }
});

// Intercepter les requêtes pour ajouter le token d'authentification
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Vous pouvez également gérer les erreurs globalement ici
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Par exemple, rediriger l'utilisateur vers la page de login en cas de token expiré
      window.location.href = '/login'; // Modifiez selon votre logique
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
