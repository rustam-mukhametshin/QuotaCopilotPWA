import { TestBed } from '@angular/core/testing';
import { Sidebar } from './sidebar';
import { CalendarStore } from '../calendar-store';

describe('Sidebar', () => {
  let store: CalendarStore;

  beforeEach(() => {
    vi.setSystemTime(new Date(2024, 1, 15));
    TestBed.configureTestingModule({
      imports: [Sidebar],
    });
    store = TestBed.inject(CalendarStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Sidebar);
    expect(fixture.componentInstance).toBeDefined();
  });

  it('renders the rounded "Per day" value', async () => {
    const fixture = TestBed.createComponent(Sidebar);
    store.totalAiCredits.set(29400); // 29400 / 21 = 1400
    fixture.detectChanges();
    await fixture.whenStable();

    const perDayInput = fixture.nativeElement.querySelector('#per-day-credits') as HTMLInputElement;

    expect(perDayInput?.value).toBe('1400');
  });

  it('keeps the Per day input readonly', async () => {
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    await fixture.whenStable();

    const perDayInput = fixture.nativeElement.querySelector('#per-day-credits') as HTMLInputElement;

    expect(perDayInput?.readOnly).toBe(true);
  });

  it('displays "—" when per day credits is null', async () => {
    const fixture = TestBed.createComponent(Sidebar);
    store.totalAiCredits.set(null);
    fixture.detectChanges();
    await fixture.whenStable();

    const perDayInput = fixture.nativeElement.querySelector('#per-day-credits') as HTMLInputElement;

    expect(perDayInput?.value).toBe('—');
  });

  it('updates totalAiCredits when the "Total AI credits" input changes', async () => {
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    await fixture.whenStable();

    const totalInput = fixture.nativeElement.querySelector('#total-ai-credits') as HTMLInputElement;

    totalInput.value = '5000';
    totalInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(store.totalAiCredits()).toBe(5000);
  });

  it('has a Save button that triggers CalendarStore.save()', async () => {
    const saveSpy = vi.spyOn(store, 'save');
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    await fixture.whenStable();

    const saveButton = fixture.nativeElement.querySelector('button') as HTMLElement;
    expect(saveButton?.textContent?.toLowerCase()).toContain('save');

    saveButton?.click();

    expect(saveSpy).toHaveBeenCalled();
  });
});
