import { Component, inject } from '@angular/core';
import { CalendarStore } from '../calendar-store';

@Component({
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  protected readonly store = inject(CalendarStore);

  protected onTotalAiCreditsInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.store.setTotalAiCredits(value);
  }

  protected onSave(): void {
    this.store.save();
  }
}
