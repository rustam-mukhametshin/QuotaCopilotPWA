import { DestroyRef, Injectable, inject, signal } from '@angular/core';

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function msUntilMidnight(now: Date): number {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime() - now.getTime();
}

/**
 * Provides a reactive signal for the current date (start-of-day).
 * Automatically updates at midnight and when the document becomes visible again.
 * Used to keep `isToday` and `isPast` flags current in calendar display.
 */
@Injectable({ providedIn: 'root' })
export class Today {
  readonly date = signal(startOfDay(new Date()));
  private timeoutId: number | undefined;
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.setupTimer();
    this.setupVisibilityListener();
  }

  private setupTimer(): void {
    this.scheduleNextMidnight();
    this.destroyRef.onDestroy(() => {
      if (this.timeoutId !== undefined) {
        clearTimeout(this.timeoutId);
      }
    });
  }

  private setupVisibilityListener(): void {
    const handler = () => this.onVisibilityChange();
    document.addEventListener('visibilitychange', handler);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', handler);
    });
  }

  private scheduleNextMidnight(): void {
    if (this.timeoutId !== undefined) {
      clearTimeout(this.timeoutId);
    }
    const delay = msUntilMidnight(new Date());
    this.timeoutId = window.setTimeout(() => {
      this.date.set(startOfDay(new Date()));
      this.scheduleNextMidnight();
    }, delay);
  }

  private onVisibilityChange(): void {
    if (document.hidden) {
      return;
    }
    const now = startOfDay(new Date());
    if (now.getTime() !== this.date().getTime()) {
      this.date.set(now);
      this.scheduleNextMidnight();
    }
  }
}
