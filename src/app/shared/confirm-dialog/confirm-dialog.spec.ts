import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';
import { vi } from 'vitest';
import type { ConfirmDialogVariant } from './confirm-dialog';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  let el: HTMLElement;
  let confirmed: Mock<() => void>;
  let cancelled: Mock<() => void>;

  function render(variant?: ConfirmDialogVariant): void {
    fixture = TestBed.createComponent(ConfirmDialog);
    fixture.componentRef.setInput('title', 'Recalculate?');
    fixture.componentRef.setInput('message', 'All values change.');
    fixture.componentRef.setInput('confirmLabel', 'Continue');
    fixture.componentRef.setInput('cancelLabel', 'Cancel');
    if (variant) {
      fixture.componentRef.setInput('confirmVariant', variant);
    }
    confirmed = vi.fn<() => void>();
    cancelled = vi.fn<() => void>();
    fixture.componentInstance.confirmed.subscribe(confirmed);
    fixture.componentInstance.cancelled.subscribe(cancelled);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  }

  function buttons(): HTMLButtonElement[] {
    return Array.from(el.querySelectorAll<HTMLButtonElement>('.confirm-dialog__footer button'));
  }

  const overlay = (): HTMLElement => el.querySelector<HTMLElement>('.confirm-dialog__overlay')!;
  const dialog = (): HTMLElement => el.querySelector<HTMLElement>('.confirm-dialog__dialog')!;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConfirmDialog] });
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('emits confirmed when the confirm button is clicked', () => {
    render();

    buttons()[1].click();

    expect(confirmed).toHaveBeenCalledTimes(1);
    expect(cancelled).not.toHaveBeenCalled();
  });

  it('emits cancelled when the cancel button is clicked', () => {
    render();

    buttons()[0].click();

    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(confirmed).not.toHaveBeenCalled();
  });

  it('emits cancelled when the overlay is clicked', () => {
    render();

    overlay().click();

    expect(cancelled).toHaveBeenCalledTimes(1);
  });

  it('does not emit when clicking inside the dialog', () => {
    render();

    dialog().click();
    el.querySelector<HTMLElement>('p')!.click();

    expect(cancelled).not.toHaveBeenCalled();
    expect(confirmed).not.toHaveBeenCalled();
  });

  it('emits cancelled on Escape and stops it from reaching document', () => {
    render();
    const documentListener = vi.fn();
    document.addEventListener('keydown', documentListener);

    buttons()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.removeEventListener('keydown', documentListener);

    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(documentListener).not.toHaveBeenCalled();
  });

  it('ignores other keys', () => {
    render();

    overlay().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(cancelled).not.toHaveBeenCalled();
    expect(confirmed).not.toHaveBeenCalled();
  });

  it('renders title, message and button labels from inputs', () => {
    render();

    expect(el.querySelector('h2')!.textContent!.trim()).toBe('Recalculate?');
    expect(el.querySelector('p')!.textContent!.trim()).toBe('All values change.');
    expect(buttons().map((b) => b.textContent!.trim())).toEqual(['Cancel', 'Continue']);
  });

  it('links the alertdialog to its title and message', () => {
    render();

    const titleId = el.querySelector('h2')!.id;
    const messageId = el.querySelector('p')!.id;
    expect(dialog().getAttribute('role')).toBe('alertdialog');
    expect(dialog().getAttribute('aria-modal')).toBe('true');
    expect(dialog().getAttribute('aria-labelledby')).toBe(titleId);
    expect(dialog().getAttribute('aria-describedby')).toBe(messageId);
  });

  it('generates unique ids per instance', () => {
    render();
    const firstId = el.querySelector('h2')!.id;
    fixture.destroy();

    render();

    expect(el.querySelector('h2')!.id).not.toBe(firstId);
  });

  it('uses btn-primary for the confirm button by default', () => {
    render();

    const confirm = buttons()[1];
    expect(confirm.classList).toContain('btn');
    expect(confirm.classList).toContain('btn-primary');
  });

  it.each<ConfirmDialogVariant>(['warning', 'danger'])(
    'uses btn-%s for the confirm button when the variant is set',
    (variant) => {
      render(variant);

      const confirm = buttons()[1];
      expect(confirm.classList).toContain('btn');
      expect(confirm.classList).toContain(`btn-${variant}`);
      expect(confirm.classList).not.toContain('btn-primary');
    },
  );

  it('renders the cancel button as btn-secondary', () => {
    render();

    expect(buttons()[0].classList).toContain('btn-secondary');
  });

  it('focuses the cancel button when opened', async () => {
    render();
    await fixture.whenStable();

    expect(document.activeElement).toBe(buttons()[0]);
  });
});
