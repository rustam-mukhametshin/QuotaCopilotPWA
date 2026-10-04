import { AfterViewInit, Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { MonthTab } from '../calendar-store';
import { CalendarStore } from '../calendar-store';

declare global {
  namespace bootstrap {
    class Popover {
      constructor(element: Element, options?: Record<string, unknown>);
      show(): void;
      hide(): void;
      dispose(): void;
      static getInstance(element: Element): Popover | null;
    }
  }
}

@Component({
  selector: 'app-month-tabs',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './month-tabs.css',
  templateUrl: './month-tabs.html',
})
export class MonthTabs implements AfterViewInit, OnDestroy {
  protected readonly store = inject(CalendarStore);
  protected readonly showPicker = signal(false);
  protected readonly pendingDeleteTab = signal<MonthTab | null>(null);

  private popoverMap = new WeakMap<HTMLElement, MonthTab>();
  private deleteButtonHandler: ((event: Event) => void) | null = null;
  private actionButtons: NodeListOf<Element> | null = null;

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

  ngAfterViewInit(): void {
    // Small delay to ensure DOM is fully rendered and Angular change detection is complete
    setTimeout(() => {
      this.initializePopovers();
    }, 100);
  }

  ngOnDestroy(): void {
    this.cleanupEventListeners();
  }

  private initializePopovers(): void {
    this.actionButtons = document.querySelectorAll('.month-tabs__tab-actions-btn');

    this.actionButtons.forEach((btn) => {
      const tabKey = (btn as HTMLElement).getAttribute('data-tab-key');
      const tab = this.store.tabs().find((t) => t.key === tabKey);

      if (tab) {
        this.popoverMap.set(btn as HTMLElement, tab);
        new bootstrap.Popover(btn, {
          trigger: 'click',
          html: true,
          content: this.getDeleteButtonContent(),
        });
      }
    });

    this.setupDeleteButtonListener();
  }

  private getDeleteButtonContent(): string {
    return `<button type="button" class="btn btn-sm btn-link text-danger w-100 text-start" data-action="delete">Удалить</button>`;
  }

  private setupDeleteButtonListener(): void {
    this.deleteButtonHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      const deleteBtn = target.closest('[data-action="delete"]');

      if (!deleteBtn) {
        return;
      }

      const popoverContainer = deleteBtn.closest('.popover');
      if (!popoverContainer) {
        return;
      }

      const triggerTab = this.findTabFromPopover(deleteBtn);
      if (triggerTab) {
        this.pendingDeleteTab.set(triggerTab);
        this.hideAllPopovers();
      }
    };

    document.addEventListener('click', this.deleteButtonHandler);
  }

  private findTabFromPopover(deleteBtn: Element): MonthTab | null {
    if (!this.actionButtons) {
      return null;
    }

    for (const btn of this.actionButtons) {
      const currentTab = this.popoverMap.get(btn as HTMLElement);
      if (!currentTab) {
        continue;
      }

      const popoverInstance = bootstrap.Popover.getInstance(btn);
      if (!popoverInstance) {
        continue;
      }

      const tipElement = (popoverInstance as any)?._tip;
      if (tipElement && tipElement.contains(deleteBtn)) {
        return currentTab;
      }
    }

    return null;
  }

  private hideAllPopovers(): void {
    if (!this.actionButtons) {
      return;
    }

    this.actionButtons.forEach((btn) => {
      bootstrap.Popover.getInstance(btn)?.hide();
    });
  }

  private cleanupEventListeners(): void {
    if (this.deleteButtonHandler) {
      document.removeEventListener('click', this.deleteButtonHandler);
      this.deleteButtonHandler = null;
    }

    if (this.actionButtons) {
      this.actionButtons.forEach((btn) => {
        bootstrap.Popover.getInstance(btn)?.dispose();
      });
      this.actionButtons = null;
    }
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
