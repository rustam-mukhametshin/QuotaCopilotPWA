import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CalendarStore } from './features/month-calendar/calendar-store';
import { formatMonthTitle } from './features/month-calendar/month-labels';
import { MonthCalendar } from './features/month-calendar/month-calendar/month-calendar';
import { CreditsProgress } from './features/month-calendar/credits-progress/credits-progress';
import { SettingsModal } from './settings/settings-modal';
import { DEFAULT_LANGUAGE } from './language-switcher/languages';
import { APP_VERSION } from './version';

@Component({
  imports: [MonthCalendar, CreditsProgress, SettingsModal],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  host: { class: 'app-shell' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly store = inject(CalendarStore);
  private readonly translate = inject(TranslateService);

  protected readonly version = APP_VERSION;
  protected readonly monthLabel = computed(() => {
    const ref = this.store.reference();
    const locale = this.translate.currentLang() ?? DEFAULT_LANGUAGE;
    return formatMonthTitle(ref.getFullYear(), ref.getMonth() + 1, locale);
  });
}
