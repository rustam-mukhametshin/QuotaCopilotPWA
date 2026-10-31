import type { DebugElement } from '@angular/core';
import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Tooltip } from './tooltip';

// Mock bootstrap namespace
function mockBootstrap(mock: object): void {
  (globalThis as unknown as { bootstrap: unknown }).bootstrap = mock;
}

@Component({
  selector: 'app-test-host',
  template: `<input [appTooltip]="tooltipText()" [tooltipPlacement]="placement" />`,
  standalone: true,
  imports: [Tooltip],
})
class TestHostComponent {
  tooltipText = signal('Test tooltip');
  placement: 'top' | 'right' | 'bottom' | 'left' = 'top';
}

describe('Tooltip Directive', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let input: DebugElement;
  let mockTooltip: { dispose: ReturnType<typeof vi.fn>; setContent: ReturnType<typeof vi.fn> };
  let TooltipConstructor: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create mock bootstrap.Tooltip
    mockTooltip = {
      dispose: vi.fn(),
      setContent: vi.fn(),
    };

    TooltipConstructor = vi.fn(function (this: Record<string, unknown>) {
      Object.assign(this, mockTooltip);
    });

    mockBootstrap({
      Tooltip: TooltipConstructor,
    });

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    input = fixture.debugElement.query((el) => el.nativeElement.tagName === 'INPUT');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create bootstrap.Tooltip on the host element', () => {
    fixture.detectChanges();

    expect(TooltipConstructor).toHaveBeenCalled();
    const call = TooltipConstructor.mock.calls[0];
    expect(call[0]).toBe(input.nativeElement);
  });

  it('should pass correct placement to bootstrap.Tooltip', () => {
    component.placement = 'right';
    fixture.detectChanges();

    expect(TooltipConstructor).toHaveBeenCalled();
    const config = TooltipConstructor.mock.calls[0][1];
    expect(config.placement).toBe('right');
  });

  it('should pass tooltip content function to bootstrap.Tooltip', () => {
    fixture.detectChanges();

    expect(TooltipConstructor).toHaveBeenCalled();
    const config = TooltipConstructor.mock.calls[0][1];
    expect(typeof config.title).toBe('function');
    expect(config.title()).toBe('Test tooltip');
  });

  it('should set hover trigger', () => {
    fixture.detectChanges();

    expect(TooltipConstructor).toHaveBeenCalled();
    const config = TooltipConstructor.mock.calls[0][1];
    expect(config.trigger).toBe('hover');
  });

  it('should update tooltip content when appTooltip input changes', async () => {
    fixture.detectChanges();
    mockTooltip.setContent.mockClear();

    component.tooltipText.set('Updated tooltip');
    fixture.detectChanges();
    await fixture.whenStable();
    TestBed.flushEffects();

    expect(mockTooltip.setContent).toHaveBeenCalledWith({
      '.tooltip-inner': 'Updated tooltip',
    });
  });

  it('should dispose tooltip on component destroy', () => {
    fixture.detectChanges();

    expect(mockTooltip.dispose).not.toHaveBeenCalled();

    fixture.destroy();

    expect(mockTooltip.dispose).toHaveBeenCalled();
  });

  it('should default to "top" placement when not specified', () => {
    fixture.detectChanges();

    expect(TooltipConstructor).toHaveBeenCalled();
    const config = TooltipConstructor.mock.calls[0][1];
    expect(config.placement).toBe('top');
  });
});
