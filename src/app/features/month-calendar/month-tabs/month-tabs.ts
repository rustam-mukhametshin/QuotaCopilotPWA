import { Component, HostListener, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { MonthTab } from '../calendar-store';
import { CalendarStore } from '../calendar-store';

@Component({
  selector: 'app-month-tabs',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  styleUrl: './month-tabs.css',
  templateUrl: './month-tabs.html',
})
export class MonthTabs implements OnDestroy {
  protected readonly store = inject(CalendarStore);
  private readonly translate = inject(TranslateService);
  protected readonly showPicker = signal(false);
  protected readonly pendingDeleteTab = signal<MonthTab | null>(null);

  private actionsPopover: bootstrap.Popover | null = null;
  private actionsTrigger: HTMLElement | null = null;

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

  protected toggleActions(tab: MonthTab, event: MouseEvent): void {
    event.stopPropagation();
    const trigger = event.currentTarget as HTMLElement;
    const isAlreadyOpen = this.actionsTrigger === trigger;

    this.closeActions();
    if (!isAlreadyOpen) {
      this.openActions(trigger, tab);
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!(event.target as Element).closest('.popover')) {
      this.closeActions();
    }
  }

  ngOnDestroy(): void {
    this.closeActions();
  }

  private openActions(trigger: HTMLElement, tab: MonthTab): void {
    this.actionsPopover = new bootstrap.Popover(trigger, {
      content: this.createDeleteButton(tab),
      html: true,
      placement: 'bottom',
      trigger: 'manual',
    });
    this.actionsTrigger = trigger;
    this.actionsPopover.show();
  }

  private closeActions(): void {
    this.actionsPopover?.dispose();
    this.actionsPopover = null;
    this.actionsTrigger = null;
  }

  private createDeleteButton(tab: MonthTab): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-sm btn-link text-danger text-decoration-none w-100 text-start';
    button.textContent = this.translate.instant('monthTabs.delete');
    button.addEventListener('click', () => {
      this.closeActions();
      this.pendingDeleteTab.set(tab);
    });
    return button;
  }

  protected cancelDelete(): void {
    this.pendingDeleteTab.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const tab = this.pendingDeleteTab();
    if (!tab) {
      return;
    }

    await this.store.deleteTab(tab.key);
    this.pendingDeleteTab.set(null);
  }

  protected onModalContentClick(event: Event): void {
    event.stopPropagation();
  }
}
