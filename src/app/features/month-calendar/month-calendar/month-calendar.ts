import { Component, inject, afterNextRender } from '@angular/core';
import { MonthView } from '../month-view/month-view';
import { Sidebar } from '../sidebar/sidebar';
import { MonthTabs } from '../month-tabs/month-tabs';
import { CalendarStore } from '../calendar-store';

@Component({
  imports: [Sidebar, MonthView, MonthTabs],
  selector: 'app-month-calendar',
  styleUrl: './month-calendar.css',
  templateUrl: './month-calendar.html',
})
export class MonthCalendar {
  private readonly store = inject(CalendarStore);

  constructor() {
    afterNextRender(() => {
      this.store.initialize();
    });
  }
}
