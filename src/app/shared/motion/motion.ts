/**
 * Default motion duration for JavaScript-based animations (milliseconds).
 */
export const MOTION_DURATION_MS = 250;

/**
 * Checks if the user has enabled the prefers-reduced-motion preference.
 * Returns false if matchMedia is not available (e.g., in some test environments).
 *
 * @returns true if reduced motion is preferred, false otherwise
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
