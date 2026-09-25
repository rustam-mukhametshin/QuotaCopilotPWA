import { Component, inject, signal } from '@angular/core';
import { CalendarStore } from '../calendar-store';

@Component({
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  protected readonly store = inject(CalendarStore);
  protected readonly isSaving = signal(false);

  protected onTotalAiCreditsInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.store.setTotalAiCredits(value);
  }

  protected async onSave(): Promise<void> {
    this.isSaving.set(true);
    try {
      await this.store.save();
    } finally {
      this.isSaving.set(false);
    }
  }
}
