import type { ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  input,
  output,
  viewChild,
} from '@angular/core';

export type ConfirmDialogVariant = 'primary' | 'warning' | 'danger';

let nextId = 0;

/** Generic confirmation modal; the parent controls visibility with `@if`. */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly cancelLabel = input.required<string>();
  readonly confirmVariant = input<ConfirmDialogVariant>('primary');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly id = nextId++;
  protected readonly titleId = `confirm-dialog-title-${this.id}`;
  protected readonly messageId = `confirm-dialog-message-${this.id}`;

  private readonly cancelButton = viewChild.required<ElementRef<HTMLButtonElement>>('cancelButton');

  constructor() {
    // Focus Cancel so Escape is handled here and a stray Enter does not confirm.
    afterNextRender(() => this.cancelButton().nativeElement.focus());
  }

  protected onDialogClick(event: Event): void {
    event.stopPropagation();
  }

  protected onEscape(event: Event): void {
    // Keep parent document-level Escape handlers (e.g. settings modal) from also firing.
    event.stopPropagation();
    this.cancelled.emit();
  }
}
