import { Injectable } from '@angular/core';
import axiosInstance from '../../../environnement/axios';
import { switchMap, startWith, catchError } from 'rxjs/operators';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import {  throttleTime, distinctUntilChanged } from 'rxjs/operators';

import {  timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
@Injectable({
  providedIn: 'root'
})
export class NiveauPoubelleService {

  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000'); // Supprimez l'option 'cors'
  }

  getSensorData(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('sensorData', (data) => {
        observer.next(data);
      });

      return () => {
        this.socket.off('sensorData');
      };
    });
  }
}
