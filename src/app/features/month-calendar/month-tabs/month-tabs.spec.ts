import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MonthTabs } from './month-tabs';
import { CalendarStore, type MonthTab } from '../calendar-store';
import { TranslateService, TranslatePipe, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideHttpClient } from '@angular/common/http';

describe('MonthTabs', () => {
  let component: MonthTabs;
  let fixture: ComponentFixture<MonthTabs>;
  let store: CalendarStore;
  let translateService: TranslateService;

  const createMockTab = (overrides?: Partial<MonthTab>): MonthTab => ({
    key: '2024-01',
    label: 'Jan 2024',
    year: 2024,
    month: 1,
    saved: true,
    ...overrides,
  });

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    // Mock bootstrap before component creation
    (globalThis as any).bootstrap = {
      Popover: vi.fn(function (this: any, element: HTMLElement, options: any) {
        this.show = vi.fn();
        this.dispose = vi.fn();
      }),
    };

    TestBed.configureTestingModule({
      imports: [MonthTabs, TranslatePipe],
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

    fixture = TestBed.createComponent(MonthTabs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('tab selection', () => {
    it('should call store.selectTab when a tab is clicked', () => {
      const selectTabSpy = vi.spyOn(store, 'selectTab');
      component['onTabClick']('2024-01');

      expect(selectTabSpy).toHaveBeenCalledWith('2024-01');
    });
  });

  describe('month picker', () => {
    it('should toggle the picker visibility', () => {
      expect(component['showPicker']()).toBe(false);

      component['togglePicker']();
      expect(component['showPicker']()).toBe(true);

      component['togglePicker']();
      expect(component['showPicker']()).toBe(false);
    });

    it('should add a new month tab when a valid month is selected', () => {
      const addMonthTabSpy = vi.spyOn(store, 'addMonthTab');
      const mockEvent = {
        target: { value: '2024-02' } as HTMLInputElement,
      } as unknown as Event;

      component['onPickerChange'](mockEvent);

      expect(addMonthTabSpy).toHaveBeenCalledWith(2024, 2);
      expect(component['showPicker']()).toBe(false);
    });

    it('should clear the input value after adding a tab', () => {
      const input = document.createElement('input');
      input.value = '2024-02';
      const mockEvent = {
        target: input,
      } as unknown as Event;

      vi.spyOn(store, 'addMonthTab');
      component['onPickerChange'](mockEvent);

      expect(input.value).toBe('');
    });

    it('should not add a tab if the input is empty', () => {
      const addMonthTabSpy = vi.spyOn(store, 'addMonthTab');
      const mockEvent = {
        target: { value: '' } as HTMLInputElement,
      } as unknown as Event;

      component['onPickerChange'](mockEvent);

      expect(addMonthTabSpy).not.toHaveBeenCalled();
    });
  });

  describe('popover for delete actions', () => {
    it('should toggle popover open when actions button is clicked', () => {
      const element = document.createElement('button');
      const mockEvent = {
        currentTarget: element,
        stopPropagation: () => {},
      } as unknown as MouseEvent;
      const tab = createMockTab();

      component['toggleActions'](tab, mockEvent);

      expect(component['actionsTrigger']).toBe(element);
      expect(component['actionsPopover']).toBeDefined();
    });

    it('should close popover when actions button is clicked again', () => {
      const element = document.createElement('button');
      const mockEvent = {
        currentTarget: element,
        stopPropagation: () => {},
      } as unknown as MouseEvent;
      const tab = createMockTab();

      component['toggleActions'](tab, mockEvent);
      const firstPopover = component['actionsPopover'];

      component['toggleActions'](tab, mockEvent);

      expect(component['actionsPopover']).not.toBe(firstPopover);
      expect(component['actionsTrigger']).toBeNull();
    });

    it('should close popover when clicking outside of it', () => {
      const element = document.createElement('button');
      const mockEvent = {
        currentTarget: element,
        stopPropagation: () => {},
      } as unknown as MouseEvent;
      const tab = createMockTab();

      component['toggleActions'](tab, mockEvent);
      expect(component['actionsPopover']).toBeDefined();

      const outsideElement = document.createElement('div');
      const clickEvent = new MouseEvent('click');
      Object.defineProperty(clickEvent, 'target', {
        value: outsideElement,
        enumerable: true,
      });

      component['onDocumentClick'](clickEvent);

      expect(component['actionsPopover']).toBeNull();
    });

    it('should create a delete button with correct text', () => {
      const tab = createMockTab();
      const translateSpy = vi.spyOn(translateService, 'instant').mockReturnValue('Delete');

      const button = component['createDeleteButton'](tab);

      expect(button.textContent).toBe('Delete');
      expect(button.className).toContain('text-danger');
      expect(button.className).toContain('text-decoration-none');
    });

    it('should set pendingDeleteTab when delete button is clicked', () => {
      const tab = createMockTab();
      vi.spyOn(translateService, 'instant').mockReturnValue('Delete');

      const button = component['createDeleteButton'](tab);
      button.click();

      expect(component['pendingDeleteTab']()).toBe(tab);
    });
  });

  describe('delete confirmation', () => {
    it('should cancel delete and clear pendingDeleteTab', () => {
      const tab = createMockTab();
      component['pendingDeleteTab'].set(tab);

      component['cancelDelete']();

      expect(component['pendingDeleteTab']()).toBeNull();
    });

    it('should call store.deleteTab when confirming delete', async () => {
      const tab = createMockTab();
      const deleteTabSpy = vi.spyOn(store, 'deleteTab').mockResolvedValue();
      component['pendingDeleteTab'].set(tab);

      await component['confirmDelete']();

      expect(deleteTabSpy).toHaveBeenCalledWith('2024-01');
      expect(component['pendingDeleteTab']()).toBeNull();
    });

    it('should not call store.deleteTab if pendingDeleteTab is null', async () => {
      const deleteTabSpy = vi.spyOn(store, 'deleteTab');

      await component['confirmDelete']();

      expect(deleteTabSpy).not.toHaveBeenCalled();
    });
  });

  describe('cleanup on destroy', () => {
    it('should close popover on component destroy', () => {
      const element = document.createElement('button');
      const mockEvent = {
        currentTarget: element,
        stopPropagation: () => {},
      } as unknown as MouseEvent;
      const tab = createMockTab();

      component['toggleActions'](tab, mockEvent);
      expect(component['actionsPopover']).toBeDefined();

      component.ngOnDestroy();

      expect(component['actionsPopover']).toBeNull();
      expect(component['actionsTrigger']).toBeNull();
    });
  });

  describe('tabular numerals', () => {
    it('applies tabular-nums to every month tab label', () => {
      store.tabs.set([
        createMockTab(),
        createMockTab({ key: '2024-02', label: 'Feb 2024', month: 2 }),
      ]);
      fixture.detectChanges();

      const tabs = Array.from(
        fixture.nativeElement.querySelectorAll('.month-tabs__tab') as NodeListOf<HTMLElement>,
      );

      expect(tabs).toHaveLength(2);
      tabs.forEach((tab) => expect(tab.classList).toContain('tabular-nums'));
      expect(tabs[0].textContent?.trim()).toBe('Jan 2024');
    });
  });

  describe('modal click handling', () => {
    it('should stop propagation when clicking inside modal', () => {
      const mockEvent = { stopPropagation: vi.fn() } as unknown as Event;

      component['onModalContentClick'](mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });
});
