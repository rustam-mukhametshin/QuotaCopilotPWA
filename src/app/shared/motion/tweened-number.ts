import { computed, DestroyRef, effect, inject, signal, Signal } from '@angular/core';
import { MOTION_DURATION_MS, prefersReducedMotion } from './motion';

interface TweenedNumberOptions {
  /**
   * Duration in milliseconds for the tween animation.
   * Defaults to MOTION_DURATION_MS (250ms).
   */
  duration?: number;
}

/**
 * Easing function: ease-out cubic (from CSS cubic-bezier(0.2, 0, 0, 1))
 * Maps t [0, 1] to eased progress [0, 1]
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Creates a signal that smoothly tweens (interpolates) a numeric value.
 *
 * When the source signal changes:
 * - If the new value is `null`, it is applied immediately without animation
 * - If the first value is set, it is applied immediately (no animation from 0)
 * - Otherwise, the value animates from the current (intermediate) value to the new value
 *   over the specified duration using ease-out easing
 * - If `prefers-reduced-motion` is enabled, the value changes immediately
 *
 * @param source The source signal whose numeric value to tween
 * @param options Optional configuration (duration in milliseconds)
 * @returns A signal that holds the tweened value
 *
 * @example
 * ```typescript
 * const credits = signal<number | null>(100);
 * const tweenedCredits = tweenedNumber(credits, { duration: 250 });
 * // When credits() changes, tweenedCredits() will smoothly interpolate over 250ms
 * ```
 */
export function tweenedNumber(
  source: Signal<number | null>,
  options?: TweenedNumberOptions,
): Signal<number | null> {
  const destroyRef = inject(DestroyRef);
  const duration = options?.duration ?? MOTION_DURATION_MS;

  // Current displayed value (tweened)
  const currentValue = signal<number | null>(null);

  // Track if this is the first assignment (no tween)
  let isFirstAssignment = true;
  let rafId: number | null = null;
  let startTime: number | null = null;
  let startValue: number | null = null;
  let targetValue: number | null = null;

  // Helper to cancel ongoing animation
  const cancelTween = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    startTime = null;
    startValue = null;
    targetValue = null;
  };

  // Set up cleanup on component destroy
  destroyRef.onDestroy(() => {
    cancelTween();
  });

  // Set up effect to watch for changes in the source signal
  effect(() => {
    const newValue = source();
    // First assignment: set immediately without animation
    if (isFirstAssignment) {
      currentValue.set(newValue);
      isFirstAssignment = false;
      return;
    }

    // If new value is null, apply immediately
    if (newValue === null) {
      cancelTween();
      currentValue.set(null);
      return;
    }

    // If reduced motion is preferred, apply immediately
    if (prefersReducedMotion()) {
      cancelTween();
      currentValue.set(newValue);
      return;
    }

    // Otherwise, start a tween animation from current to new value
    cancelTween();
    targetValue = newValue;
    startValue = currentValue() ?? newValue;
    startTime = performance.now();

    const animate = (now: number) => {
      if (startTime === null || targetValue === null || startValue === null) {
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      // Interpolate from startValue to targetValue
      const tweened = startValue + (targetValue - startValue) * eased;
      currentValue.set(tweened);

      // Continue animation if not finished
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        rafId = null;
        startTime = null;
        startValue = null;
        targetValue = null;
      }
    };

    rafId = requestAnimationFrame(animate);
  });

  return computed(() => currentValue());
}
