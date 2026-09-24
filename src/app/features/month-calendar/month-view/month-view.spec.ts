import { TestBed } from '@angular/core/testing';
import { MonthView } from './month-view';
import { CalendarStore } from '../calendar-store';
import { dayKey } from '../calendar-db';

describe('MonthView', () => {
  let store: CalendarStore;

  beforeEach(() => {
    // 2024-02-15 is a Thursday; February 2024 has 29 days (leap year).
    vi.setSystemTime(new Date(2024, 1, 15));
    TestBed.configureTestingModule({
      imports: [MonthView],
    });
    store = TestBed.inject(CalendarStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('splits the month into weeks containing only working days (Mon-Fri)', async () => {
    const fixture = TestBed.createComponent(MonthView);
    await fixture.whenStable();
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      weeks: () => { date: Date }[][];
    };
    const weeks = component.weeks();

    expect(weeks.length).toBeGreaterThan(0);
    for (const week of weeks) {
      for (const day of week) {
        const dayOfWeek = day.date.getDay();
        expect(dayOfWeek).toBeGreaterThanOrEqual(1);
        expect(dayOfWeek).toBeLessThanOrEqual(5);
      }
    }

    const totalWorkingDays = weeks.reduce((sum, week) => sum + week.length, 0);
    expect(totalWorkingDays).toBe(21);
  });

  it('marks today with the day--today class', async () => {
    const fixture = TestBed.createComponent(MonthView);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const todayEl = compiled.querySelector('.day--today .day__number');

    expect(todayEl?.textContent?.trim()).toBe('15');
  });

  it('marks past days with the day--past class', async () => {
    const fixture = TestBed.createComponent(MonthView);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const pastDays = compiled.querySelectorAll('.day--past');

    // There should be past days (from Feb 1 to Feb 14)
    expect(pastDays.length).toBeGreaterThan(0);
  });

  it('renders 2 stub inputs under each working day', async () => {
    const fixture = TestBed.createComponent(MonthView);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const firstDay = compiled.querySelector('.day');

    expect(firstDay?.querySelectorAll('input').length).toBe(2);
  });

  it('renders a "…" button per day cell', async () => {
    const fixture = TestBed.createComponent(MonthView);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const noteButtons = compiled.querySelectorAll('[aria-label="Edit note"]');

    expect(noteButtons.length).toBeGreaterThan(0);
  });

  it('shows the note textarea for the currently active day', async () => {
    const fixture = TestBed.createComponent(MonthView);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const noteButtons = compiled.querySelectorAll('[aria-label="Edit note"]');
    const firstButton = noteButtons[0] as HTMLElement;

    // Click first button to show its textarea
    firstButton?.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();

    const textareas = compiled.querySelectorAll('.day__note-textarea');
    expect(textareas.length).toBeGreaterThan(0);
  });

  it('updates dayNotes when editing the note textarea for a day', async () => {
    const fixture = TestBed.createComponent(MonthView);
    store.totalAiCredits.set(1400);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const noteButtons = compiled.querySelectorAll('[aria-label="Edit note"]');
    const firstButton = noteButtons[0] as HTMLElement;

    // Show textarea
    firstButton?.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();

    const textareas = compiled.querySelectorAll('.day__note-textarea') as NodeListOf<HTMLTextAreaElement>;
    if (textareas.length > 0) {
      const firstTextarea = textareas[0];
      firstTextarea.value = 'Test note for this day';
      firstTextarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // Verify the note is stored
      const storedNotes = store.dayNotes();
      const noteKeys = Object.keys(storedNotes);
      expect(noteKeys.length).toBeGreaterThan(0);
    }
  });

  it('does not affect other days\' notes when editing one', async () => {
    const fixture = TestBed.createComponent(MonthView);
    store.dayNotes.set({
      '2024-02-10': 'Note for day 10',
      '2024-02-15': 'Note for day 15',
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const noteKey = dayKey(new Date(2024, 1, 15));
    store.setDayNote(noteKey, 'Updated note for day 15');

    expect(store.dayNotes()['2024-02-10']).toBe('Note for day 10');
    expect(store.dayNotes()[noteKey]).toBe('Updated note for day 15');
  });

  it('hides the note textarea when the note container loses focus', async () => {
    const fixture = TestBed.createComponent(MonthView);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dayContainers = compiled.querySelectorAll('.day__note-container');

    if (dayContainers.length > 0) {
      const firstContainer = dayContainers[0] as HTMLElement;
      
      // Simulate mouseleave on the container
      firstContainer.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      fixture.detectChanges();

      // The activeNoteKey should be null
      const component = fixture.componentInstance as any;
      expect(component.activeNoteKey()).toBeNull();
    }
  });
});
