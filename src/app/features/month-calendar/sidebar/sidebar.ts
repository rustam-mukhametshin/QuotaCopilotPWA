import type { AfterViewInit, OnDestroy } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CalendarStore } from '../calendar-store';

@Component({
  selector: 'app-sidebar',
  imports: [TranslatePipe],
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar implements AfterViewInit, OnDestroy {
  protected readonly store = inject(CalendarStore);
  protected readonly isSaving = signal(false);
  protected readonly showToast = signal(false);
  protected readonly isLoading = signal(true);

  private toastTimeout: ReturnType<typeof setTimeout> | null = null;
  private tooltips: bootstrap.Tooltip[] = [];
  private readonly TOAST_DURATION_MS = 3000;
  private readonly DEFAULT_AI_CREDITS = 10000;

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
    this.initializeTooltips();
  }

  ngOnDestroy(): void {
    this.cleanupToastTimeout();
    this.cleanupTooltips();
  }

  private initializeData(): void {
    // Initialize default credits if null
    if (this.store.totalAiCredits() === null) {
      this.store.setTotalAiCredits(String(this.DEFAULT_AI_CREDITS));
    }
    // Mark loading as complete once data is available
    this.isLoading.set(false);
  }

  private showSuccessToast(): void {
    this.showToast.set(true);
    this.scheduleToastHide();
  }

  private initializeTooltips(): void {
    const totalAiCreditsLabel = document.querySelector('label[for="total-ai-credits"]');

    if (totalAiCreditsLabel) {
      const tooltip = new bootstrap.Tooltip(totalAiCreditsLabel, {
        title: (element) => element.getAttribute('data-bs-title') ?? '',
        placement: 'right',
        trigger: 'hover',
      });
      this.tooltips.push(tooltip);
    }
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

  private cleanupTooltips(): void {
    this.tooltips.forEach((tooltip) => tooltip.dispose());
    this.tooltips = [];
  }
}
