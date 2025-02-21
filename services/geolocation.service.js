// geolocation.service.js
const axios = require('axios');
const NodeCache = require('node-cache');

// Cache pour éviter trop de requêtes répétées vers l'API OSM
const addressCache = new NodeCache({ stdTTL: 86400 }); // 24h de cache

class GeolocationService {
  /**
   * Convertit une adresse en coordonnées géographiques (géocodage)
   * Utilise l'API Nominatim d'OpenStreetMap (gratuit)
   * 
   * @param {string} adresse - L'adresse à géocoder
   * @returns {Promise<Object>} - Coordonnées {latitude, longitude}
   */
  static async getCoordinatesFromAddress(adresse) {
    try {
      // Vérifier si l'adresse est dans le cache
      const cacheKey = `addr:${adresse}`;
      const cachedResult = addressCache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Respecter les limites d'usage de l'API (max 1 requête par seconde)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: adresse,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': 'AlertesApp/1.0'  // Important pour OSM
        }
      });
      
      if (response.data && response.data.length > 0) {
        const result = {
          latitude: parseFloat(response.data[0].lat),
          longitude: parseFloat(response.data[0].lon),
          displayName: response.data[0].display_name
        };
        
        // Mettre en cache le résultat
        addressCache.set(cacheKey, result);
        
        return result;
      }
      
      throw new Error('Adresse non trouvée');
    } catch (error) {
      console.error('Erreur de géocodage:', error.message);
      throw new Error(`Impossible de convertir l'adresse en coordonnées: ${error.message}`);
    }
  }
  
  /**
   * Convertit des coordonnées en adresse (géocodage inverse)
   * 
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<string>} - Adresse formatée
   */
  static async getAddressFromCoordinates(latitude, longitude) {
    try {
      // Vérifier si les coordonnées sont dans le cache
      const cacheKey = `coords:${latitude},${longitude}`;
      const cachedResult = addressCache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      
      // Respecter les limites d'usage de l'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json'
        },
        headers: {
          'User-Agent': 'AlertesApp/1.0'
        }
      });
      
      if (response.data && response.data.display_name) {
        // Mettre en cache le résultat
        addressCache.set(cacheKey, response.data.display_name);
        
        return response.data.display_name;
      }
      
      throw new Error('Coordonnées non trouvées');
    } catch (error) {
      console.error('Erreur de géocodage inverse:', error.message);
      throw new Error(`Impossible de convertir les coordonnées en adresse: ${error.message}`);
    }
  }
  
  /**
   * Calcule la distance entre deux points géographiques en kilomètres
   * Utilise la formule de Haversine
   * 
   * @param {number} lat1 - Latitude du point 1
   * @param {number} lon1 - Longitude du point 1
   * @param {number} lat2 - Latitude du point 2
   * @param {number} lon2 - Longitude du point 2
   * @returns {number} - Distance en kilomètres
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance en km
    
    return distance;
  }
  
  /**
   * Convertit les degrés en radians
   * 
   * @param {number} deg - Angle en degrés
   * @returns {number} - Angle en radians
   */
  static deg2rad(deg) {
    return deg * (Math.PI/180);
  }
}

module.exports = GeolocationService;