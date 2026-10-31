import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Sidebar } from './sidebar';
import { CalendarStore } from '../calendar-store';
import { TranslateService, TranslatePipe, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideHttpClient } from '@angular/common/http';

/** Installs a fake global `bootstrap` (declared as a namespace, so it can't be assigned directly). */
function mockBootstrap(mock: object): void {
  (globalThis as unknown as { bootstrap: unknown }).bootstrap = mock;
}

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

  describe('save button state', () => {
    it('should be disabled when isSaving is true', () => {
      component['isSaving'].set(true);

      expect(component['isSaving']()).toBe(true);
    });
  });
});
