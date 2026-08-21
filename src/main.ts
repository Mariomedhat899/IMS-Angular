import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).then(() => {
  const preloader = document.getElementById('app-preloader');
  if (preloader) {
    preloader.classList.add('is-hidden');
    setTimeout(() => preloader.remove(), 300);
  }
});
