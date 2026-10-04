import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CalendarStore } from '../calendar-store';

@Component({
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
  host: {
    class: 'mt-0 mt-md-5',
  },
})
export class Sidebar implements OnDestroy {
  protected readonly store = inject(CalendarStore);
  protected readonly isSaving = signal(false);
  protected readonly showToast = signal(false);

  private toastTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly TOAST_DURATION_MS = 3000;

  protected onTotalAiCreditsInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.store.setTotalAiCredits(value);
  }

  protected async onSave(): Promise<void> {
    this.isSaving.set(true);
    try {
      await this.store.save();
      this.showSuccessToast();
    } finally {
      this.isSaving.set(false);
    }
  }

  protected hideToast(): void {
    this.showToast.set(false);
  }

  private showSuccessToast(): void {
    this.showToast.set(true);
    this.scheduleToastHide();
  }

  private scheduleToastHide(): void {
    // Clear any existing timeout
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.hideToast();
      this.toastTimeout = null;
    }, this.TOAST_DURATION_MS);
  }

  ngOnDestroy(): void {
    this.cleanupToastTimeout();
  }

  private cleanupToastTimeout(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }
}
