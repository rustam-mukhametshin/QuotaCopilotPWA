import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarStore, MonthTab } from '../calendar-store';
import { monthKey } from '../calendar-db';

@Component({
  selector: 'app-month-tabs',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './month-tabs.css',
  templateUrl: './month-tabs.html',
})
export class MonthTabs {
  protected readonly store = inject(CalendarStore);
  protected readonly showPicker = signal(false);
  protected readonly openMenuKey = signal<string | null>(null);
  protected readonly pendingDeleteTab = signal<MonthTab | null>(null);

  protected onTabClick(key: string): void {
    this.store.selectTab(key);
  }

  protected onPickerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!value) {
      return;
    }

    // Parse YYYY-MM format
    const [yearStr, monthStr] = value.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    this.store.addMonthTab(year, month);
    this.showPicker.set(false);
    input.value = '';
  }

  protected togglePicker(): void {
    this.showPicker.update((val) => !val);
  }

  protected toggleActionsMenu(key: string, event: Event): void {
    event.stopPropagation();
    this.openMenuKey.update((current) => (current === key ? null : key));
  }

  protected closeActionsMenu(): void {
    this.openMenuKey.set(null);
  }

  protected onDeleteClick(tab: MonthTab, event: Event): void {
    event.stopPropagation();
    this.closeActionsMenu();
    this.pendingDeleteTab.set(tab);
  }
}
