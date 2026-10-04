import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { CalendarStore } from '../calendar-store';
import { tweenedNumber } from '../../../shared/motion/tweened-number';

@Component({
  selector: 'app-credits-progress',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './credits-progress.html',
  styleUrl: './credits-progress.css',
})
export class CreditsProgress {
  protected readonly store = inject(CalendarStore);

  private readonly THRESHOLD_WARNING = 50;
  private readonly THRESHOLD_DANGER = 20;

  protected readonly tweenedRemaining = tweenedNumber(this.store.remainingCredits);
  protected readonly tweenedPercent = tweenedNumber(this.store.remainingPercent);

  protected readonly progressBarClass = computed<string>(() => {
    const percent = this.store.remainingPercent();
    if (percent === null) {
      return '';
    }
    if (percent > this.THRESHOLD_WARNING) {
      return 'bg-success';
    }
    if (percent >= this.THRESHOLD_DANGER) {
      return 'bg-warning';
    }
    return 'bg-danger';
  });

  getRemaining(): string {
    const remaining = this.tweenedRemaining();
    return remaining === null ? '—' : Math.round(remaining).toString();
  }

  getTotal(): string {
    const total = this.store.totalAiCredits();
    return total === null ? '—' : total.toString();
  }

  getProgressPercent(): number {
    const percent = this.tweenedPercent();
    return percent === null ? 0 : percent;
  }
}
