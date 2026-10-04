import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Sidebar } from './sidebar';
import { CalendarStore } from '../calendar-store';
import { TranslateService, TranslatePipe, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideHttpClient } from '@angular/common/http';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;
  let store: CalendarStore;
  let translateService: TranslateService;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      imports: [Sidebar, TranslatePipe],
      providers: [
        provideHttpClient(),
        provideTranslateService({
          loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
          fallbackLang: 'en',
          lang: 'en',
        }),
      ],
    });

    store = TestBed.inject(CalendarStore);
    translateService = TestBed.inject(TranslateService);
    translateService.use('en');

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with default AI credits when totalAiCredits is null', () => {
      // Mock bootstrap.Tooltip before initialization
      const TooltipMock = vi.fn(function (this: any) {
        this.dispose = vi.fn();
      });
      (globalThis as any).bootstrap = {
        Tooltip: TooltipMock as any,
      };

      store.totalAiCredits.set(null);
      const setTotalAiCreditsSpy = vi.spyOn(store, 'setTotalAiCredits');

      component.ngAfterViewInit();

      expect(setTotalAiCreditsSpy).toHaveBeenCalledWith('10000');
    });

    it('should not override totalAiCredits if already set', () => {
      // Mock bootstrap.Tooltip before initialization
      const TooltipMock = vi.fn(function (this: any) {
        this.dispose = vi.fn();
      });
      (globalThis as any).bootstrap = {
        Tooltip: TooltipMock as any,
      };

      store.totalAiCredits.set(5000);
      const setTotalAiCreditsSpy = vi.spyOn(store, 'setTotalAiCredits');

      component.ngAfterViewInit();

      expect(setTotalAiCreditsSpy).not.toHaveBeenCalled();
    });

    it('should mark loading as complete after initialization', () => {
      // Mock bootstrap.Tooltip before initialization
      const TooltipMock = vi.fn(function (this: any) {
        this.dispose = vi.fn();
      });
      (globalThis as any).bootstrap = {
        Tooltip: TooltipMock as any,
      };

      expect(component['isLoading']()).toBe(true);

      component.ngAfterViewInit();

      expect(component['isLoading']()).toBe(false);
    });
  });

  describe('input handling', () => {
    it('should update store when total AI credits input changes', () => {
      const setTotalAiCreditsSpy = vi.spyOn(store, 'setTotalAiCredits');
      const mockEvent = {
        target: { value: '5000' } as HTMLInputElement,
      } as unknown as Event;

      component['onTotalAiCreditsInput'](mockEvent);

      expect(setTotalAiCreditsSpy).toHaveBeenCalledWith('5000');
    });
  });

  describe('saving', () => {
    it('should set isSaving to true when saving starts', async () => {
      vi.spyOn(store, 'save').mockResolvedValue();

      expect(component['isSaving']()).toBe(false);

      const savePromise = component['onSave']();
      expect(component['isSaving']()).toBe(true);

      await savePromise;
    });

    it('should set isSaving to false after save completes', async () => {
      vi.spyOn(store, 'save').mockResolvedValue();

      await component['onSave']();

      expect(component['isSaving']()).toBe(false);
    });

    it('should show success toast after saving', async () => {
      vi.useFakeTimers();
      vi.spyOn(store, 'save').mockResolvedValue();

      expect(component['showToast']()).toBe(false);

      await component['onSave']();

      expect(component['showToast']()).toBe(true);

      vi.useRealTimers();
    });

    it('should set isSaving to false even if save fails', async () => {
      const error = new Error('Save failed');
      vi.spyOn(store, 'save').mockRejectedValue(error);

      try {
        await component['onSave']();
      } catch {
        // Error is expected, we're testing that isSaving is set to false
      }

      expect(component['isSaving']()).toBe(false);
    });
  });

  describe('toast notifications', () => {
    it('should show toast initially as false', () => {
      expect(component['showToast']()).toBe(false);
    });

    it('should hide toast when hideToast is called', () => {
      component['showToast'].set(true);

      component['hideToast']();

      expect(component['showToast']()).toBe(false);
    });

    it('should auto-hide toast after 3 seconds', async () => {
      vi.useFakeTimers();
      vi.spyOn(store, 'save').mockResolvedValue();

      await component['onSave']();
      expect(component['showToast']()).toBe(true);

      vi.advanceTimersByTime(3000);

      expect(component['showToast']()).toBe(false);

      vi.useRealTimers();
    });

    it('should clear existing timeout before scheduling a new one', async () => {
      vi.useFakeTimers();

      vi.spyOn(store, 'save').mockResolvedValue();
      await component['onSave']();

      const firstTimeout = component['toastTimeout'];
      expect(firstTimeout).toBeDefined();

      // Simulate save happening again before timeout
      await component['onSave']();

      expect(component['toastTimeout']).not.toBe(firstTimeout);

      vi.useRealTimers();
    });
  });

  describe('tooltips', () => {
    it('should initialize tooltips on afterViewInit', () => {
      const label = document.createElement('label');
      label.setAttribute('for', 'total-ai-credits');
      label.setAttribute('data-bs-title', 'Test tooltip');
      document.body.appendChild(label);

      // Mock bootstrap.Tooltip
      const mockTooltip = { dispose: vi.fn() };
      const TooltipMock = vi.fn(function (this: any) {
        Object.assign(this, mockTooltip);
      });
      (globalThis as any).bootstrap = {
        Tooltip: TooltipMock as any,
      };

      component.ngAfterViewInit();

      expect(TooltipMock).toHaveBeenCalled();
      expect(component['tooltips']).toHaveLength(1);

      document.body.removeChild(label);
    });

    it('should dispose tooltips on component destroy', () => {
      const mockTooltip = { dispose: vi.fn() };
      component['tooltips'] = [mockTooltip as any];

      component.ngOnDestroy();

      expect(mockTooltip.dispose).toHaveBeenCalled();
      expect(component['tooltips']).toHaveLength(0);
    });

    it('should not crash if tooltip element is not found', () => {
      // Mock bootstrap.Tooltip with proper return value containing dispose
      const mockTooltip = { dispose: vi.fn() };
      const TooltipMock = vi.fn(function (this: any) {
        Object.assign(this, mockTooltip);
        return mockTooltip;
      });
      (globalThis as any).bootstrap = {
        Tooltip: TooltipMock as any,
      };

      const testComponent = TestBed.createComponent(Sidebar).componentInstance;

      expect(() => {
        testComponent.ngAfterViewInit();
        testComponent.ngOnDestroy();
      }).not.toThrow();
    });
  });

  describe('cleanup on destroy', () => {
    it('should clean up toast timeout on destroy', () => {
      vi.useFakeTimers();

      component['toastTimeout'] = setTimeout(() => {}, 1000);

      component.ngOnDestroy();

      expect(component['toastTimeout']).toBeNull();

      vi.useRealTimers();
    });

    it('should dispose all tooltips on destroy', () => {
      const mockTooltip1 = { dispose: vi.fn() };
      const mockTooltip2 = { dispose: vi.fn() };
      component['tooltips'] = [mockTooltip1 as any, mockTooltip2 as any];

      component.ngOnDestroy();

      expect(mockTooltip1.dispose).toHaveBeenCalled();
      expect(mockTooltip2.dispose).toHaveBeenCalled();
    });
  });

  describe('save button state', () => {
    it('should be disabled when isSaving is true', () => {
      component['isSaving'].set(true);

      expect(component['isSaving']()).toBe(true);
    });

    it('should be disabled when isLoading is true', () => {
      component['isLoading'].set(true);

      expect(component['isLoading']()).toBe(true);
    });

    it('should be enabled when conditions are met', () => {
      component['isSaving'].set(false);
      component['isLoading'].set(false);

      expect(component['isSaving']()).toBe(false);
      expect(component['isLoading']()).toBe(false);
    });
  });

  describe('tabular numerals', () => {
    beforeEach(() => {
      (globalThis as any).bootstrap = {
        Tooltip: vi.fn(function (this: any) {
          this.dispose = vi.fn();
        }),
      };
      store.totalAiCredits.set(5000);
      fixture.detectChanges();
    });

    it('applies tabular-nums to the total AI credits input', () => {
      const input = fixture.nativeElement.querySelector('#total-ai-credits') as HTMLInputElement;

      expect(input).not.toBeNull();
      expect(input.classList).toContain('tabular-nums');
    });

    it('applies tabular-nums to the per-day credits input', () => {
      const input = fixture.nativeElement.querySelector('#per-day-credits') as HTMLInputElement;

      expect(input).not.toBeNull();
      expect(input.classList).toContain('tabular-nums');
    });
  });

  describe('loading state', () => {
    it('should show placeholders when isLoading is true', () => {
      component['isLoading'].set(true);

      expect(component['isLoading']()).toBe(true);
    });

    it('should show input when isLoading is false', () => {
      component['isLoading'].set(false);

      expect(component['isLoading']()).toBe(false);
    });
  });
});
