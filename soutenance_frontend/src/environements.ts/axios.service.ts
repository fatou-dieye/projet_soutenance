import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; // Remplacez par l'URL de votre API

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default axiosInstance;
