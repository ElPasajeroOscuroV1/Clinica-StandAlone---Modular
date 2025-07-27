import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Si estás usando Ionic, probablemente ya tengas algo como esto:
//import { IonicModule } from '@ionic/angular';

// Importa y define los PWA Elements
import { defineCustomElements } from '@ionic/pwa-elements/loader'; // <-- Añade esta línea

// Llama a esta función inmediatamente al cargar la configuración
// Esto es crucial para que los elementos estén listos antes de que Angular intente renderizarlos.
defineCustomElements(window); // <-- Añade esta línea aquí

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
    // Si usas Ionic, asegúrate de que IonicModule esté importado.
    // Podría ser algo como:
    // importProvidersFrom(IonicModule.forRoot())
    ]
  
};
