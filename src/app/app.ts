import { Component, inject } from '@angular/core';
import { CalendarStore } from './features/month-calendar/calendar-store';
import { MonthCalendar } from './features/month-calendar/month-calendar/month-calendar';
import { CreditsProgress } from './features/month-calendar/credits-progress/credits-progress';
import { SettingsModal } from './settings/settings-modal';
import { APP_VERSION } from './version';

@Component({
  imports: [MonthCalendar, CreditsProgress, SettingsModal],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  host: { class: 'app-shell' },
})
export class App {
  protected readonly version = APP_VERSION;
  protected readonly monthLabel = inject(CalendarStore).monthLabel;
}
