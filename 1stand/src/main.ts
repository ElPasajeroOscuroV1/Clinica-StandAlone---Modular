import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// try to load JIT compiler dynamically
import(/* @vite-ignore */ '@angular/compiler').then(() => {
  console.log('JIT Compiler loaded successfully');
}).catch(() => {
  console.log('JIT Compiler not needed for this build mode');
});

// Bootstrap the application
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

defineCustomElements(window);
