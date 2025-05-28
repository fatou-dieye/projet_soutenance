import axios from 'axios';

// Configurer Axios avec l'URL de l'API et les en-têtes par défaut
const axiosInstance = axios.create({
  // baseURL: 'http://backend:3000/api',

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
      // Vérifier si nous sommes déjà sur la page de connexion
      const currentPath = window.location.pathname;
      
      // Ne redirige que si nous ne sommes PAS déjà sur la page de connexion
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
      // Si nous sommes déjà sur la page de login, ne fait rien et laisse l'erreur se propager
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;