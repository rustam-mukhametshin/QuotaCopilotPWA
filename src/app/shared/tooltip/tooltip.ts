import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
} from '@angular/core';

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

/** Attaches a Bootstrap tooltip to the host element for the host's lifetime. */
@Directive({
  selector: '[appTooltip]',
})
export class Tooltip {
  readonly appTooltip = input.required<string>();
  readonly tooltipPlacement = input<TooltipPlacement>('top');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private tooltip: bootstrap.Tooltip | null = null;

  constructor() {
    afterNextRender(() => {
      this.tooltip = new bootstrap.Tooltip(this.host.nativeElement, {
        title: () => this.appTooltip(),
        placement: this.tooltipPlacement(),
        trigger: 'hover',
      });
    });

    effect(() => {
      const text = this.appTooltip();
      this.tooltip?.setContent({ '.tooltip-inner': text });
    });

    inject(DestroyRef).onDestroy(() => {
      this.tooltip?.dispose();
      this.tooltip = null;
    });
  }
}
