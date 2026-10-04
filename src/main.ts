import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { applyTheme, readSavedThemeMode } from './app/theme-switcher/theme';

applyTheme(readSavedThemeMode());

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
