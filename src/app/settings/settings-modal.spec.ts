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
  pendingHideWeekends: () => boolean;
  includeWeekendsChecked: () => boolean;
  onEscape(): void;
  confirmIncludeWeekends(): void;
  cancelIncludeWeekends(): void;
  confirmHideWeekends(): void;
  cancelHideWeekends(): void;
  onIncludeWeekendsChange(event: Event): void;
  onOverlayClick(event: MouseEvent): void;
  onDefaultCreditsChange(event: Event): void;
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

  describe('include weekends requires shown weekends', () => {
    function hideWeekendsViaCheckbox(): void {
      showCheckbox().click();
      fixture.detectChanges();
    }

    it('includeWeekendsChecked is false while weekends are hidden, even if the month includes them', () => {
      store.includeWeekends.set(true);
      preferences.setShowWeekends(false);

      expect(logic.includeWeekendsChecked()).toBe(false);
    });

    it('includeWeekendsChecked follows includeWeekends while weekends are shown', () => {
      preferences.setShowWeekends(true);

      store.includeWeekends.set(true);
      expect(logic.includeWeekendsChecked()).toBe(true);

      store.includeWeekends.set(false);
      expect(logic.includeWeekendsChecked()).toBe(false);
    });

    it('hiding weekends with includeWeekends = false applies immediately without a dialog', () => {
      const spy = vi.spyOn(preferences, 'setShowWeekends');
      openModal();

      hideWeekendsViaCheckbox();

      expect(spy).toHaveBeenCalledWith(false);
      expect(preferences.showWeekends()).toBe(false);
      expect(logic.pendingHideWeekends()).toBe(false);
      expect(confirmDialog()).toBeNull();
    });

    it('hiding weekends with includeWeekends = true asks for confirmation and keeps the checkbox on', () => {
      store.includeWeekends.set(true);
      const spy = vi.spyOn(preferences, 'setShowWeekends');
      openModal();

      hideWeekendsViaCheckbox();

      expect(spy).not.toHaveBeenCalled();
      expect(preferences.showWeekends()).toBe(true);
      expect(showCheckbox().checked).toBe(true);
      expect(logic.pendingHideWeekends()).toBe(true);
      expect(confirmDialog()).not.toBeNull();
    });

    it('confirmHideWeekends hides weekends, excludes them from the month and clears pending', () => {
      store.includeWeekends.set(true);
      preferences.setDefaultIncludeWeekends(true);
      openModal();
      hideWeekendsViaCheckbox();

      logic.confirmHideWeekends();
      fixture.detectChanges();

      expect(preferences.showWeekends()).toBe(false);
      expect(store.includeWeekends()).toBe(false);
      expect(preferences.defaultIncludeWeekends()).toBe(false);
      expect(logic.pendingHideWeekends()).toBe(false);
      expect(confirmDialog()).toBeNull();
    });

    it('cancelHideWeekends keeps settings unchanged and clears pending', () => {
      store.includeWeekends.set(true);
      preferences.setDefaultIncludeWeekends(true);
      openModal();
      hideWeekendsViaCheckbox();
      const showSpy = vi.spyOn(preferences, 'setShowWeekends');
      const includeSpy = vi.spyOn(store, 'setIncludeWeekends');

      logic.cancelHideWeekends();
      fixture.detectChanges();

      expect(showSpy).not.toHaveBeenCalled();
      expect(includeSpy).not.toHaveBeenCalled();
      expect(preferences.showWeekends()).toBe(true);
      expect(store.includeWeekends()).toBe(true);
      expect(preferences.defaultIncludeWeekends()).toBe(true);
      expect(logic.pendingHideWeekends()).toBe(false);
      expect(showCheckbox().checked).toBe(true);
    });

    it('onIncludeWeekendsChange while weekends are hidden is ignored and reverts the checkbox', () => {
      preferences.setShowWeekends(false);
      openModal();
      const spy = vi.spyOn(store, 'setIncludeWeekends');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;

      logic.onIncludeWeekendsChange({ target: checkbox } as unknown as Event);

      expect(checkbox.checked).toBe(false);
      expect(logic.pendingIncludeWeekends()).toBeNull();
      expect(spy).not.toHaveBeenCalled();
    });

    it('Escape with a pending hide confirmation closes only the confirmation', () => {
      store.includeWeekends.set(true);
      openModal();
      hideWeekendsViaCheckbox();

      pressEscape();

      expect(logic.pendingHideWeekends()).toBe(false);
      expect(logic.isOpen()).toBe(true);
      expect(preferences.showWeekends()).toBe(true);
      expect(store.includeWeekends()).toBe(true);
    });

    it('close() resets a pending hide confirmation', () => {
      store.includeWeekends.set(true);
      openModal();
      hideWeekendsViaCheckbox();

      component.close();

      expect(logic.isOpen()).toBe(false);
      expect(logic.pendingHideWeekends()).toBe(false);
    });
  });

  describe('overlay clicks and dropdown closing', () => {
    it('onOverlayClick closes the modal when the backdrop itself is clicked', () => {
      openModal();
      const overlay = el.querySelector<HTMLElement>('.settings-modal__overlay')!;

      logic.onOverlayClick({ target: overlay, currentTarget: overlay } as unknown as MouseEvent);

      expect(logic.isOpen()).toBe(false);
    });

    it('onOverlayClick keeps the modal open for clicks inside the dialog', () => {
      openModal();
      const overlay = el.querySelector<HTMLElement>('.settings-modal__overlay')!;
      const dialog = el.querySelector<HTMLElement>('.settings-modal__dialog')!;

      logic.onOverlayClick({ target: dialog, currentTarget: overlay } as unknown as MouseEvent);

      expect(logic.isOpen()).toBe(true);
    });

    it('clicking the overlay element closes the modal', () => {
      openModal();

      el.querySelector<HTMLElement>('.settings-modal__overlay')!.click();
      fixture.detectChanges();

      expect(logic.isOpen()).toBe(false);
    });

    it('clicking inside the dialog does not close the modal', () => {
      openModal();

      el.querySelector<HTMLElement>('.settings-modal__dialog')!.click();
      fixture.detectChanges();

      expect(logic.isOpen()).toBe(true);
    });

    it('clicks inside the dialog bubble up to document', () => {
      openModal();
      const listener = vi.fn();
      document.addEventListener('click', listener);

      try {
        el.querySelector<HTMLElement>('.settings-modal__dialog')!.click();
      } finally {
        document.removeEventListener('click', listener);
      }

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('default credits (Step 6)', () => {
    function changeEvent(
      value: string,
      badInput = false,
    ): { event: Event; input: HTMLInputElement } {
      const input = document.createElement('input');
      input.type = 'number';
      input.value = value;
      Object.defineProperty(input, 'validity', { value: { badInput } });
      const event = new Event('change');
      Object.defineProperty(event, 'target', { value: input });
      return { event, input };
    }

    it('saves a positive number', () => {
      const spy = vi.spyOn(store, 'setDefaultTotalAiCredits');
      const { event } = changeEvent('5000');

      logic.onDefaultCreditsChange(event);

      expect(spy).toHaveBeenCalledWith(5000);
      expect(store.defaultTotalAiCredits()).toBe(5000);
    });

    it('resets the setting to 10000 on empty input', () => {
      store.setDefaultTotalAiCredits(5000);
      const spy = vi.spyOn(store, 'setDefaultTotalAiCredits');
      const { event, input } = changeEvent('  ');

      logic.onDefaultCreditsChange(event);

      expect(spy).toHaveBeenCalledWith(null);
      expect(input.value).toBe('10000');
    });

    it.each(['0', '-3'])('does not save %j and restores the current value', (raw) => {
      store.setDefaultTotalAiCredits(5000);
      const spy = vi.spyOn(store, 'setDefaultTotalAiCredits');
      const { event, input } = changeEvent(raw);

      logic.onDefaultCreditsChange(event);

      expect(spy).not.toHaveBeenCalled();
      expect(input.value).toBe('5000');
    });

    it('does not save on badInput and restores the current value', () => {
      store.setDefaultTotalAiCredits(5000);
      const spy = vi.spyOn(store, 'setDefaultTotalAiCredits');
      const { event, input } = changeEvent('', true);

      logic.onDefaultCreditsChange(event);

      expect(spy).not.toHaveBeenCalled();
      expect(input.value).toBe('5000');
      expect(store.defaultTotalAiCredits()).toBe(5000);
    });
  });
});
