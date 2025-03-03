import { Injectable } from '@angular/core';
import axiosInstance from '../../environnement/axios';
@Injectable({
  providedIn: 'root'
})
export class AlertPoubelleService {

  constructor() { }

//recuperer tout les alerte des poubels
  getAlerts() {
    return axiosInstance.get('/alerts');
  }
}
