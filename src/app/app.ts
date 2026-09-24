import { Component } from '@angular/core';
import { MonthCalendar } from './features/month-calendar/month-calendar/month-calendar';

@Component({
  imports: [MonthCalendar],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
