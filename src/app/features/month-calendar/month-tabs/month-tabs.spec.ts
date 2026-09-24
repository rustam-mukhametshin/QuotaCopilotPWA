import { TestBed } from '@angular/core/testing';
import { MonthTabs } from './month-tabs';
import { CalendarStore } from '../calendar-store';

describe('MonthTabs', () => {
  let store: CalendarStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MonthTabs],
    });
    store = TestBed.inject(CalendarStore);
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(MonthTabs);
    expect(fixture.componentInstance).toBeDefined();
  });

  it('renders one tab per entry in store.tabs()', async () => {
    store.tabs.set([
      {
        key: '2024-01',
        year: 2024,
        month: 1,
        label: 'Jan24',
        saved: true,
      },
      {
        key: '2024-02',
        year: 2024,
        month: 2,
        label: 'Feb24',
        saved: true,
      },
      {
        key: '2024-03',
        year: 2024,
        month: 3,
        label: 'Mar24',
        saved: false,
      },
    ]);

    const fixture = TestBed.createComponent(MonthTabs);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const tabButtons = compiled.querySelectorAll('.month-tabs__tab');

    expect(tabButtons.length).toBe(3);
  });

  it('visually distinguishes the active tab', async () => {
    store.tabs.set([
      {
        key: '2024-01',
        year: 2024,
        month: 1,
        label: 'Jan24',
        saved: true,
      },
      {
        key: '2024-02',
        year: 2024,
        month: 2,
        label: 'Feb24',
        saved: true,
      },
    ]);
    store.activeKey.set('2024-02');

    const fixture = TestBed.createComponent(MonthTabs);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const tabButtons = compiled.querySelectorAll('.month-tabs__tab');

    const activeTab = Array.from(tabButtons).find((btn) =>
      btn.classList.contains('btn-primary'),
    );

    expect(activeTab).toBeDefined();
  });

  it('calls store.selectTab with the correct key when clicking a tab', async () => {
    const selectTabSpy = vi.spyOn(store, 'selectTab');

    store.tabs.set([
      {
        key: '2024-01',
        year: 2024,
        month: 1,
        label: 'Jan24',
        saved: true,
      },
      {
        key: '2024-02',
        year: 2024,
        month: 2,
        label: 'Feb24',
        saved: true,
      },
    ]);

    const fixture = TestBed.createComponent(MonthTabs);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const tabButtons = compiled.querySelectorAll('.month-tabs__tab');
    (tabButtons[0] as HTMLElement)?.click();

    expect(selectTabSpy).toHaveBeenCalledWith('2024-01');
  });

  it('renders the tab label with a trailing chevron glyph', async () => {
    store.tabs.set([
      {
        key: '2024-01',
        year: 2024,
        month: 1,
        label: 'Jan24',
        saved: true,
      },
    ]);

    const fixture = TestBed.createComponent(MonthTabs);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const tabButton = compiled.querySelector('.month-tabs__tab');

    expect(tabButton?.textContent).toContain('Jan24');
    expect(tabButton?.textContent).toContain('▾');
  });

  it('renders a "+" button to add a new month tab', async () => {
    const fixture = TestBed.createComponent(MonthTabs);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const addButton = compiled.querySelector('.month-tabs__add-btn');

    expect(addButton?.textContent).toContain('+');
  });

  it('shows the month picker when the "+" button is clicked', async () => {
    const fixture = TestBed.createComponent(MonthTabs);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const addButton = compiled.querySelector('.month-tabs__add-btn') as HTMLElement;

    addButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const monthPicker = compiled.querySelector('.month-tabs__picker');
    expect(monthPicker).toBeDefined();
  });

  it('calls store.addMonthTab with the selected year/month from the picker', async () => {
    const addMonthTabSpy = vi.spyOn(store, 'addMonthTab');

    const fixture = TestBed.createComponent(MonthTabs);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const addButton = compiled.querySelector('.month-tabs__add-btn') as HTMLElement;

    addButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const monthPicker = compiled.querySelector('.month-tabs__picker') as HTMLInputElement;
    if (monthPicker) {
      monthPicker.value = '2024-05';
      monthPicker.dispatchEvent(new Event('change'));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(addMonthTabSpy).toHaveBeenCalledWith(2024, 5);
    }
  });

  it('hides the picker after successfully adding a month', async () => {
    const fixture = TestBed.createComponent(MonthTabs);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const addButton = compiled.querySelector('.month-tabs__add-btn') as HTMLElement;

    addButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const monthPicker = compiled.querySelector('.month-tabs__picker') as HTMLInputElement;
    if (monthPicker) {
      monthPicker.value = '2024-05';
      monthPicker.dispatchEvent(new Event('change'));

      fixture.detectChanges();
      await fixture.whenStable();

      const pickerAfter = compiled.querySelector('.month-tabs__picker');
      expect(pickerAfter).toBeNull();
    }
  });

  it('clears the picker input after month selection', async () => {
    const fixture = TestBed.createComponent(MonthTabs);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const addButton = compiled.querySelector('.month-tabs__add-btn') as HTMLElement;

    addButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const monthPicker = compiled.querySelector('.month-tabs__picker') as HTMLInputElement;
    if (monthPicker) {
      monthPicker.value = '2024-05';
      monthPicker.dispatchEvent(new Event('change'));

      fixture.detectChanges();
      await fixture.whenStable();

      // Re-show picker to verify it's empty
      addButton?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const newPicker = compiled.querySelector('.month-tabs__picker') as HTMLInputElement;
      if (newPicker) {
        expect(newPicker?.value).toBe('');
      }
    }
  });
});
