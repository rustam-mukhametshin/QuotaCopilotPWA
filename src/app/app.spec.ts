import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { App } from './app';
import { APP_VERSION } from './version';

describe('App', () => {
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [App] });
    // Render only the shell template; child feature components are not under test here.
    TestBed.overrideComponent(App, { set: { imports: [], schemas: [NO_ERRORS_SCHEMA] } });

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  describe('footer', () => {
    it('displays the app version', () => {
      const footer = element.querySelector('footer.app-footer');

      expect(footer?.textContent?.trim()).toBe(`v${APP_VERSION}`);
    });

    it('applies tabular-nums to the version footer', () => {
      const footer = element.querySelector('footer.app-footer');

      expect(footer).not.toBeNull();
      expect(footer!.classList).toContain('tabular-nums');
    });
  });
});
