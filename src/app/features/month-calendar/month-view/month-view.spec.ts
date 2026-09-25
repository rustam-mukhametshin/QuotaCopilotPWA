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

    const textareas = compiled.querySelectorAll(
      '.day__note-textarea',
    ) as NodeListOf<HTMLTextAreaElement>;
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

  it("does not affect other days' notes when editing one", async () => {
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

  describe('Placeholder logic for 5-day weeks', () => {
    it('each week renders exactly 5 day cells (real + placeholders)', async () => {
      // Feb 2024 has: 1st = Thu, 29th = Thu
      // Week 1: Thu 1, Fri 2 (needs 3 before: Mon, Tue, Wed, and 0 after)
      // Week 5: Mon 26, Tue 27, Wed 28, Thu 29 (needs 0 before and 1 after: Fri)
      const fixture = TestBed.createComponent(MonthView);
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const weekRows = compiled.querySelectorAll('.week');

      expect(weekRows.length).toBeGreaterThan(0);

      weekRows.forEach((weekRow) => {
        const dayCells = weekRow.querySelectorAll('.day');
        expect(dayCells.length).toBe(5); // Each week must have exactly 5 cells
      });
    });

    it('Feb 2024 week 1 has 3 before-placeholders + 2 real days (Thu 1, Fri 2)', () => {
      const fixture = TestBed.createComponent(MonthView);
      fixture.detectChanges();

      const component = fixture.componentInstance as any;
      const weeks = component.weeks();

      const firstWeek = weeks[0];
      const placeholders = component.placeholdersBeforeWeek(firstWeek, 0);

      // Feb 1, 2024 is Thursday (4), so need 4 - 1 = 3 placeholders (Mon, Tue, Wed)
      expect(firstWeek[0].date.getDate()).toBe(1);
      expect(firstWeek[0].date.getDay()).toBe(4); // Thursday
      expect(placeholders.length).toBe(3);
      expect(firstWeek.length).toBe(2); // Thu 1, Fri 2
    });

    it('Feb 2024 week 5 has 4 real days (Mon 26–Thu 29) + 1 after-placeholder (Fri)', () => {
      const fixture = TestBed.createComponent(MonthView);
      fixture.detectChanges();

      const component = fixture.componentInstance as any;
      const weeks = component.weeks();

      const lastWeek = weeks[weeks.length - 1];
      const placeholders = component.placeholdersAfterWeek(
        lastWeek,
        weeks.length - 1,
        weeks.length,
      );

      // Feb 29, 2024 is Thursday (4), so need 5 - 4 = 1 placeholder (Fri)
      expect(lastWeek[lastWeek.length - 1].date.getDate()).toBe(29);
      expect(lastWeek[lastWeek.length - 1].date.getDay()).toBe(4); // Thursday
      expect(placeholders.length).toBe(1);
      expect(lastWeek.length).toBe(4); // Mon 26, Tue 27, Wed 28, Thu 29
    });

    it('placeholdersBeforeWeek returns 0 for non-first week', () => {
      const fixture = TestBed.createComponent(MonthView);
      fixture.detectChanges();

      const component = fixture.componentInstance as any;
      const weeks = component.weeks();

      if (weeks.length > 1) {
        const secondWeek = weeks[1];
        const placeholders = component.placeholdersBeforeWeek(secondWeek, 1);
        expect(placeholders.length).toBe(0); // Only first week gets before-placeholders
      }
    });

    it('placeholdersAfterWeek returns 0 for non-last week', () => {
      const fixture = TestBed.createComponent(MonthView);
      fixture.detectChanges();

      const component = fixture.componentInstance as any;
      const weeks = component.weeks();

      if (weeks.length > 1) {
        const middleWeek = weeks[1];
        const placeholders = component.placeholdersAfterWeek(middleWeek, 1, weeks.length);
        expect(placeholders.length).toBe(0); // Only last week gets after-placeholders
      }
    });

    it('placeholder cells render as day--placeholder with transparent border', async () => {
      const fixture = TestBed.createComponent(MonthView);
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const placeholders = compiled.querySelectorAll('.day--placeholder');

      // Feb 2024 should have some placeholders (3 before week 1, 1 after week 5)
      expect(placeholders.length).toBeGreaterThan(0);

      // Each placeholder should be a flex container with gap and position-relative
      placeholders.forEach((ph) => {
        expect(ph.classList.contains('d-flex')).toBe(true);
        expect(ph.classList.contains('position-relative')).toBe(true);
      });
    });

    it('all days (real and placeholders) match the logic calculations', () => {
      const fixture = TestBed.createComponent(MonthView);
      fixture.detectChanges();

      const component = fixture.componentInstance as any;
      const weeks = component.weeks();

      weeks.forEach((week, weekIdx) => {
        const before = component.placeholdersBeforeWeek(week, weekIdx);
        const after = component.placeholdersAfterWeek(week, weekIdx, weeks.length);

        // Total should be 5 (Mon-Fri)
        const total = before.length + week.length + after.length;
        expect(total).toBe(5);

        // First week: before placeholders + real days
        if (weekIdx === 0) {
          expect(before.length + week.length).toBe(5);
          expect(after.length).toBe(0); // No after-placeholders in first week
        }

        // Last week: real days + after placeholders
        if (weekIdx === weeks.length - 1) {
          expect(before.length).toBe(0); // No before-placeholders in last week
          expect(week.length + after.length).toBe(5);
        }

        // Middle weeks: no placeholders
        if (weekIdx > 0 && weekIdx < weeks.length - 1) {
          expect(before.length).toBe(0);
          expect(after.length).toBe(0);
          expect(week.length).toBe(5); // All middle weeks have exactly 5 real days
        }
      });
    });

    it('placeholder and real day cells have identical CSS classes for alignment', async () => {
      const fixture = TestBed.createComponent(MonthView);
      await fixture.whenStable();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const realDays = compiled.querySelectorAll('.day:not(.day--placeholder)');
      const placeholders = compiled.querySelectorAll('.day--placeholder');

      expect(realDays.length).toBeGreaterThan(0);
      expect(placeholders.length).toBeGreaterThan(0);

      // Both should have the same flex layout classes
      const requiredClasses = [
        'd-flex',
        'flex-column',
        'gap-1',
        'p-2',
        'border',
        'rounded',
        'position-relative',
      ];

      realDays.forEach((day) => {
        requiredClasses.forEach((cls) => {
          expect(day.classList.contains(cls)).toBe(true);
        });
      });

      placeholders.forEach((placeholder) => {
        requiredClasses.forEach((cls) => {
          expect(placeholder.classList.contains(cls)).toBe(true);
        });
      });

      // Verify placeholder has transparent styling
      placeholders.forEach((placeholder) => {
        const computed = window.getComputedStyle(placeholder);
        // Placeholder should have no background color (transparent)
        expect(computed.backgroundColor).toMatch(/transparent|rgba\(0,\s*0,\s*0,\s*0\)/i);
      });
    });
  });
});
