import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

// Manual Service Worker registration with error handling
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/ngsw-worker.js').then((registration) => {
    console.log('Service Worker registered successfully:', registration);
    
    // Check for updates periodically (every hour)
    setInterval(() => {
      registration.update();
    }, 3600000);
  }).catch((error) => {
    console.error('Service Worker registration failed:', error);
  });
}
