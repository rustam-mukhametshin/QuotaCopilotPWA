import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { TranslatePipe, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { vi } from 'vitest';
import { SettingsModal } from './settings-modal';
import { WeekendPreferences } from './weekend-preferences';
import { CalendarStore } from '../features/month-calendar/calendar-store';
import { ConfirmDialog } from '../shared/confirm-dialog/confirm-dialog';

/** Access to protected members of SettingsModal. */
interface SettingsModalLogic {
  isOpen: () => boolean;
  pendingIncludeWeekends: () => boolean | null;
  onEscape(): void;
  confirmIncludeWeekends(): void;
  cancelIncludeWeekends(): void;
  onIncludeWeekendsChange(event: Event): void;
}

describe('SettingsModal', () => {
  let fixture: ComponentFixture<SettingsModal>;
  let component: SettingsModal;
  let logic: SettingsModalLogic;
  let el: HTMLElement;
  let store: CalendarStore;
  let preferences: WeekendPreferences;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [SettingsModal, TranslatePipe],
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
    preferences = TestBed.inject(WeekendPreferences);
    fixture = TestBed.createComponent(SettingsModal);
    component = fixture.componentInstance;
    logic = component as unknown as SettingsModalLogic;
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function openModal(): void {
    component.open();
    fixture.detectChanges();
  }

  const showCheckbox = (): HTMLInputElement =>
    el.querySelector<HTMLInputElement>('#settings-show-weekends')!;
  const includeCheckbox = (): HTMLInputElement =>
    el.querySelector<HTMLInputElement>('#settings-include-weekends')!;

  function requestIncludeWeekends(): void {
    includeCheckbox().click();
    fixture.detectChanges();
  }

  function confirmDialog(): ConfirmDialog | null {
    return fixture.debugElement.query(By.directive(ConfirmDialog))?.componentInstance ?? null;
  }

  function pressEscape(): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
  }

  describe('show weekends (Step 7)', () => {
    it('reflects the current preference in the checkbox', () => {
      preferences.setShowWeekends(false);
      openModal();

      expect(showCheckbox().checked).toBe(false);
    });

    it('applies a change immediately via setShowWeekends', () => {
      const spy = vi.spyOn(preferences, 'setShowWeekends');
      openModal();

      showCheckbox().click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(false);
      expect(preferences.showWeekends()).toBe(false);
      expect(logic.pendingIncludeWeekends()).toBeNull();
      expect(confirmDialog()).toBeNull();
    });
  });

  describe('include weekends (Step 7)', () => {
    it('reflects the active month flag in the checkbox', () => {
      store.includeWeekends.set(true);
      openModal();

      expect(includeCheckbox().checked).toBe(true);
    });

    it('does not apply a change immediately: sets pending and reverts the checkbox', () => {
      const spy = vi.spyOn(store, 'setIncludeWeekends');
      openModal();

      requestIncludeWeekends();

      expect(logic.pendingIncludeWeekends()).toBe(true);
      expect(includeCheckbox().checked).toBe(false);
      expect(store.includeWeekends()).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });

    it('requests false when unchecking an included month', () => {
      store.includeWeekends.set(true);
      openModal();

      requestIncludeWeekends();

      expect(logic.pendingIncludeWeekends()).toBe(false);
      expect(includeCheckbox().checked).toBe(true);
    });

    it('confirmIncludeWeekends applies the pending value and clears it', () => {
      const spy = vi.spyOn(store, 'setIncludeWeekends');
      openModal();
      requestIncludeWeekends();

      logic.confirmIncludeWeekends();

      expect(spy).toHaveBeenCalledWith(true);
      expect(store.includeWeekends()).toBe(true);
      expect(logic.pendingIncludeWeekends()).toBeNull();
    });

    it('confirmIncludeWeekends does nothing without a pending value', () => {
      const spy = vi.spyOn(store, 'setIncludeWeekends');

      logic.confirmIncludeWeekends();

      expect(spy).not.toHaveBeenCalled();
    });

    it('cancelIncludeWeekends keeps the flag and clears pending', () => {
      const spy = vi.spyOn(store, 'setIncludeWeekends');
      openModal();
      requestIncludeWeekends();

      logic.cancelIncludeWeekends();

      expect(spy).not.toHaveBeenCalled();
      expect(store.includeWeekends()).toBe(false);
      expect(logic.pendingIncludeWeekends()).toBeNull();
    });

    it('Escape with a pending confirmation closes only the confirmation', () => {
      openModal();
      requestIncludeWeekends();

      logic.onEscape();

      expect(logic.pendingIncludeWeekends()).toBeNull();
      expect(logic.isOpen()).toBe(true);
      expect(store.includeWeekends()).toBe(false);
    });

    it('Escape on document without a confirmation closes the modal', () => {
      openModal();

      pressEscape();

      expect(logic.isOpen()).toBe(false);
    });

    it('close() resets a pending confirmation', () => {
      openModal();
      requestIncludeWeekends();

      component.close();

      expect(logic.isOpen()).toBe(false);
      expect(logic.pendingIncludeWeekends()).toBeNull();
      expect(store.includeWeekends()).toBe(false);
    });
  });

  describe('confirmation dialog (Step 9)', () => {
    it('is not rendered until the include-weekends checkbox changes', () => {
      openModal();

      expect(confirmDialog()).toBeNull();
    });

    it('renders app-confirm-dialog with a warning variant and no inline alert', () => {
      openModal();

      requestIncludeWeekends();

      const dialog = confirmDialog();
      expect(dialog).not.toBeNull();
      expect(dialog!.confirmVariant()).toBe('warning');
      expect(el.querySelector('.settings-modal__dialog .alert')).toBeNull();
      expect(el.querySelector('.settings-modal__overlay app-confirm-dialog')).toBeNull();
    });

    it('passes translated texts to the dialog', () => {
      openModal();

      requestIncludeWeekends();

      const dialog = confirmDialog()!;
      expect(dialog.title()).toBeTruthy();
      expect(dialog.message()).toBeTruthy();
      expect(dialog.confirmLabel()).toBeTruthy();
      expect(dialog.cancelLabel()).toBeTruthy();
    });

    it('confirmed applies the flag, hides the dialog and keeps settings open', async () => {
      const spy = vi.spyOn(store, 'setIncludeWeekends');
      openModal();
      requestIncludeWeekends();

      confirmDialog()!.confirmed.emit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(spy).toHaveBeenCalledWith(true);
      expect(store.includeWeekends()).toBe(true);
      expect(confirmDialog()).toBeNull();
      expect(logic.isOpen()).toBe(true);
      expect(el.querySelector('.settings-modal__dialog')).not.toBeNull();
      expect(includeCheckbox().checked).toBe(true);
    });

    it('cancelled keeps the flag, hides the dialog and keeps settings open', async () => {
      const spy = vi.spyOn(store, 'setIncludeWeekends');
      openModal();
      requestIncludeWeekends();

      confirmDialog()!.cancelled.emit();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(spy).not.toHaveBeenCalled();
      expect(store.includeWeekends()).toBe(false);
      expect(confirmDialog()).toBeNull();
      expect(logic.isOpen()).toBe(true);
      expect(includeCheckbox().checked).toBe(false);
    });

    it('clicking the dialog overlay cancels without closing settings', () => {
      openModal();
      requestIncludeWeekends();

      el.querySelector<HTMLElement>('.confirm-dialog__overlay')!.click();
      fixture.detectChanges();

      expect(logic.pendingIncludeWeekends()).toBeNull();
      expect(logic.isOpen()).toBe(true);
    });

    it('Escape inside the dialog cancels it without closing settings', () => {
      openModal();
      requestIncludeWeekends();

      el.querySelector<HTMLElement>('.confirm-dialog__overlay button')!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
      fixture.detectChanges();

      expect(logic.pendingIncludeWeekends()).toBeNull();
      expect(logic.isOpen()).toBe(true);
    });
  });
});
