import type { AfterViewInit, OnDestroy } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CalendarStore } from '../calendar-store';
import { tweenedNumber } from '../../../shared/motion/tweened-number';
import { Tooltip } from '../../../shared/tooltip/tooltip';

@Component({
  selector: 'app-sidebar',
  imports: [TranslatePipe, Tooltip],
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar implements AfterViewInit, OnDestroy {
  protected readonly store = inject(CalendarStore);
  protected readonly isSaving = signal(false);
  protected readonly showToast = signal(false);
  protected readonly isLoading = signal(true);

  protected readonly tweenedPerDayCredits = tweenedNumber(this.store.perDayCredits);

  private toastTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly TOAST_DURATION_MS = 3000;

  protected getPerDayCreditsDisplay(): string {
    const value = this.tweenedPerDayCredits();
    return value === null ? '—' : Math.round(value).toString();
  }

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

  ngAfterViewInit(): void {
    this.initializeData();
  }

  ngOnDestroy(): void {
    this.cleanupToastTimeout();
  }

  private initializeData(): void {
    // Mark loading as complete once data is available
    this.isLoading.set(false);
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
  private cleanupToastTimeout(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }
}
