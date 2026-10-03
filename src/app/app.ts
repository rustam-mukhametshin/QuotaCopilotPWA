import { Component } from '@angular/core';
import { MonthCalendar } from './features/month-calendar/month-calendar/month-calendar';
import { APP_VERSION } from './version';

@Component({
  imports: [MonthCalendar],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly version = APP_VERSION;
}
