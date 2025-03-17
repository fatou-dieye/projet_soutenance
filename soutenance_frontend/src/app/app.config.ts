import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';

import { AuthInterceptor } from './interceptors/auth.interceptor';

import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { CommonModule } from '@angular/common'; // Importez le CommonModule

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
};