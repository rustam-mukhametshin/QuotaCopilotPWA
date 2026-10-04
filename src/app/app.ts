import { Component, inject } from '@angular/core';
import { CalendarStore } from './features/month-calendar/calendar-store';
import { MonthCalendar } from './features/month-calendar/month-calendar/month-calendar';
import { LanguageSwitcher } from './language-switcher/language-switcher';
import { ThemeSwitcher } from './theme-switcher/theme-switcher';
import { APP_VERSION } from './version';

@Component({
  imports: [MonthCalendar, LanguageSwitcher, ThemeSwitcher],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  host: { class: 'app-shell' },
})
export class App {
  protected readonly version = APP_VERSION;
  protected readonly monthLabel = inject(CalendarStore).monthLabel;
}
