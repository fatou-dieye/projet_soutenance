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

// Gérer les erreurs globalement avec une logique de redirection intelligente
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
